import { VerifyOtpRequestDto, VerifyOtpResponseDto } from "@/application/dtos/AuthDTOs";

export interface IVerifyOtpUseCase {
  execute(dto: VerifyOtpRequestDto): Promise<VerifyOtpResponseDto>;
}
