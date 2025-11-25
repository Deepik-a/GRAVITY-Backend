export interface IAdminLoginUseCase {
  execute(
    email: string,
    password: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    message: string;
  }>;
}
