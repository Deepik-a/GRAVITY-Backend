export interface IJwtService {
  signAccessToken(payload: Record<string, any>): string;
  signRefreshToken(payload: Record<string, any>): string;
  verifyAccessToken(token: string): any;
  verifyRefreshToken(token: string): any;
}
