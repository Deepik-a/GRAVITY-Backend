import { ProfileResponseDTO } from "../../../dtos/ProfileResponseDTO";
import { GetUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";

export interface IGetUserProfileUseCase {
  execute(dto: GetUserProfileRequestDto): Promise<ProfileResponseDTO>;
}
