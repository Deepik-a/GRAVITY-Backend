import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { UpdateUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";

export interface IUpdateUserProfileUseCase {
  execute(dto: UpdateUserProfileRequestDto): Promise<ProfileResponseDTO>;
}
