import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { env } from "../lib/env";
import { getSessionCookieOptions } from "../lib/cookies";
import { Session } from "@contracts/constants";
import { signSessionToken } from "./session";
import { findUserByGoogleId, upsertGoogleUser } from "../queries/users";
import type { GoogleProfile } from "./types";

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token exchange failed (${resp.status}): ${text}`);
  }

  return resp.json() as Promise<{ access_token: string }>;
}

async function getGoogleProfile(
  accessToken: string,
): Promise<GoogleProfile | null> {
  const resp = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!resp.ok) {
    console.error("Failed to fetch Google profile:", resp.status);
    return null;
  }

  return resp.json() as Promise<GoogleProfile>;
}

export function createGoogleCallbackHandler() {
  return async (c: Context) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    if (error) {
      if (error === "access_denied") {
        return c.redirect("/login?error=access_denied", 302);
      }
      return c.json({ error }, 400);
    }

    if (!code || !state) {
      return c.json({ error: "code and state are required" }, 400);
    }

    try {
      const redirectUri = atob(state);
      const tokenResp = await exchangeGoogleCode(code, redirectUri);
      const profile = await getGoogleProfile(tokenResp.access_token);

      if (!profile || !profile.email) {
        throw new Error("Failed to fetch Google profile");
      }

      const user = await upsertGoogleUser({
        googleId: profile.id,
        email: profile.email,
        name: profile.name || profile.email.split("@")[0],
        avatar: profile.picture,
        emailVerified: true,
        lastSignInAt: new Date(),
      });

      if (!user) {
        throw new Error("Failed to create/update user");
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

      return c.redirect("/", 302);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      return c.redirect("/login?error=oauth_failed", 302);
    }
  };
}
