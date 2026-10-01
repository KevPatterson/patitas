import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

export interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface UploadFileInput {
  fileContent: Uint8Array | Buffer;
  fileName: string;
  contentType?: string;
}

export interface UploadResult {
  key: string;
  fileName: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlResult {
  key: string;
  url: string;
  expireTime: string;
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function guessContentType(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return "application/octet-stream";
  return MIME_BY_EXT[fileName.slice(dot).toLowerCase()] ?? "application/octet-stream";
}

function uniqueKey(fileName: string): string {
  const slash = fileName.lastIndexOf("/");
  const dir = slash < 0 ? "" : fileName.slice(0, slash + 1);
  const base = slash < 0 ? fileName : fileName.slice(slash + 1);
  const dot = base.lastIndexOf(".");
  const suffix = randomBytes(4).toString("hex");
  
  if (dot <= 0) return `${dir}${base}-${suffix}`;
  return `${dir}${base.slice(0, dot)}-${suffix}${base.slice(dot)}`;
}

export class S3Storage {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // Necesario para endpoints S3-compatible como R2
    });
    this.bucket = config.bucket;
  }

  /**
   * Sube un archivo al bucket S3
   */
  async uploadFile(input: UploadFileInput): Promise<UploadResult> {
    const contentType = input.contentType ?? guessContentType(input.fileName);
    const key = uniqueKey(input.fileName);
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: input.fileContent,
      ContentType: contentType,
    });

    await this.client.send(command);

    return {
      key,
      fileName: key.split("/").pop() || key,
      size: input.fileContent.length,
      contentType,
    };
  }

  /**
   * Obtiene una URL firmada para acceder a un archivo
   */
  async getPresignedUrl(
    key: string,
    expiresIn: number = 600
  ): Promise<PresignedUrlResult> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // Verificar que el archivo existe
    await this.client.send(command);

    const getCommand = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const url = await getSignedUrl(this.client, getCommand as any, {
      expiresIn,
    });

    const expireTime = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      key,
      url,
      expireTime,
    };
  }

  /**
   * Obtiene URLs firmadas para múltiples archivos
   */
  async getPresignedUrls(
    keys: string[],
    expiresIn: number = 600
  ): Promise<{
    urls: PresignedUrlResult[];
    failures: { key: string; message: string }[];
  }> {
    const results = await Promise.allSettled(
      keys.map((key) => this.getPresignedUrl(key, expiresIn))
    );

    const urls: PresignedUrlResult[] = [];
    const failures: { key: string; message: string }[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        urls.push(result.value);
      } else {
        failures.push({
          key: keys[index],
          message: result.reason?.message || "Unknown error",
        });
      }
    });

    return { urls, failures };
  }

  /**
   * Elimina un archivo del bucket
   */
  async deleteFile(key: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
    return true;
  }

  /**
   * Elimina múltiples archivos del bucket
   */
  async deleteFiles(
    keys: string[]
  ): Promise<{ deleted: string[]; failed: { key: string; message: string }[] }> {
    if (keys.length === 0) {
      return { deleted: [], failed: [] };
    }

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    const result = await this.client.send(command);

    const deleted = result.Deleted?.map((obj) => obj.Key || "") || [];
    const failed =
      result.Errors?.map((err) => ({
        key: err.Key || "",
        message: err.Message || "Unknown error",
      })) || [];

    return { deleted, failed };
  }

  /**
   * Verifica si un archivo existe
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Crea una instancia de S3Storage desde variables de entorno
 */
export function createS3StorageFromEnv(): S3Storage | null {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    console.warn(
      "[S3 Storage] Variables de entorno S3 no configuradas. El almacenamiento de imágenes no estará disponible."
    );
    return null;
  }

  return new S3Storage({
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucket,
  });
}

// Instancia singleton
let storageInstance: S3Storage | null = null;

export function getStorage(): S3Storage {
  if (!storageInstance) {
    storageInstance = createS3StorageFromEnv();
    if (!storageInstance) {
      throw new Error(
        "S3 Storage no configurado. Configure las variables de entorno S3_*"
      );
    }
  }
  return storageInstance;
}
