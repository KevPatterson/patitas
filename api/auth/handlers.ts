import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import { Errors } from "@contracts/errors";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "../lib/cookies";
import { signSessionToken } from "./session";
import { hashPassword, verifyPassword } from "./password";
import { findUserByEmail, createUser } from "../queries/users";
import type { RegisterInput, LoginInput } from "./types";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function handleRegister(c: Context) {
  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body) as RegisterInput;

    const existing = await findUserByEmail(data.email);
    if (existing) {
      throw Errors.badRequest("Email already registered");
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      emailVerified: false,
    });

    if (!user) {
      throw Errors.internal("Failed to create user");
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
    });

    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    setCookie(c, Session.cookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    return c.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.issues }, 400);
    }
    if (error && typeof error === "object" && "status" in error) {
      return c.json({ error: (error as any).message }, (error as any).status);
    }
    console.error("[Register] Error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
}

export async function handleLogin(c: Context) {
  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body) as LoginInput;

    const user = await findUserByEmail(data.email);
    if (!user || !user.password) {
      throw Errors.unauthorized("Invalid email or password");
    }

    const isValid = await verifyPassword(data.password, user.password);
    if (!isValid) {
      throw Errors.unauthorized("Invalid email or password");
    }

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
    });

    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    setCookie(c, Session.cookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    return c.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.issues }, 400);
    }
    if (error && typeof error === "object" && "status" in error) {
      return c.json({ error: (error as any).message }, (error as any).status);
    }
    console.error("[Login] Error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
}
