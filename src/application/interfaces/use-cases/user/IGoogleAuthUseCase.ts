import { GoogleAuthRequestDto, GoogleAuthResponseDto } from "@/application/dtos/AuthDTOs";

export interface IGoogleAuthUseCase {
  execute(dto: GoogleAuthRequestDto): Promise<GoogleAuthResponseDto>;
}
