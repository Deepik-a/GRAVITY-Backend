export interface IJwtService {
  signAccessToken(payload: Record<string, unknown>): string;
  signRefreshToken(payload: Record<string, unknown>): string;
  verifyAccessToken(token: string): Record<string, unknown>;
  verifyRefreshToken(token: string): Record<string, unknown>;
}
