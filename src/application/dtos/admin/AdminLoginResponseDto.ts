export interface AdminLoginResponseDto {
  accessToken: string;
  refreshToken: string;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
