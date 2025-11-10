// ✅ verifyGoogleToken.ts
import { OAuth2Client } from "google-auth-library";
import { VerifiedGoogleUser } from "../../application/dtos/GoogleUserResponseDTO.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string): Promise<VerifiedGoogleUser> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error("Invalid Google token");

  return {
    googleId: payload.sub!,
    email: payload.email,
    name: payload.name!,
  };
}
