import { OAuth2Client } from "google-auth-library";
import { VerifiedGoogleUser } from "@/application/dtos/AuthDTOs";
import { env } from "@/infrastructure/config/env";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string): Promise<VerifiedGoogleUser> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new AppError("Invalid Google token", StatusCode.UNAUTHORIZED);

  return {
    googleId: payload.sub || "",
    email: payload.email,
    name: payload.name || "",
  };
}
