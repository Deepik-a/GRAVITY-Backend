import { SignupRequestDto } from "@/application/dtos/user/SignupRequestDto";
import { SignupResponseDto } from "@/application/dtos/user/SignupResponseDto";

export interface IRegisterUseCase {
  execute(payload: SignupRequestDto): Promise<SignupResponseDto>;
}
