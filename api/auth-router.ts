import * as cookie from "cookie";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { generateOAuthState } from "./lib/oauth-state";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
  
  // Genera un state OAuth seguro para el flujo de Google
  getOAuthState: publicQuery
    .input(z.object({ redirectUri: z.string().url() }))
    .query(({ input }) => {
      const state = generateOAuthState(input.redirectUri);
      return { state };
    }),
});
