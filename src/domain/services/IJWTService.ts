export interface IJwtService {
  //Authentication:
  signAccessToken(payload: Record<string, unknown>): string;
  signRefreshToken(payload: Record<string, unknown>): string;
  //Authorization:
  verifyAccessToken(token: string): Record<string, unknown>;
  verifyRefreshToken(token: string): Record<string, unknown>;
}
