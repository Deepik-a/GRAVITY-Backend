import { ResetPasswordRequestDto, ResetPasswordResponseDto } from "@/application/dtos/AuthDTOs";

export interface IResetPasswordUseCase {
  execute(dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto>;
}
