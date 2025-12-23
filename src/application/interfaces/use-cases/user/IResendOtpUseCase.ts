import { ResendOtpRequestDto, ResendOtpResponseDto } from "@/application/dtos/AuthDTOs";

export interface IResendOtpUseCase {
  execute(dto: ResendOtpRequestDto): Promise<ResendOtpResponseDto>;
}
