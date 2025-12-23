import { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "@/application/dtos/AuthDTOs";

export interface IForgotPasswordUseCase {
  execute(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto>;
}
