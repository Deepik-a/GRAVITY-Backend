import { ProfileResponseDTO } from "../../../dtos/ProfileResponseDTO";

export interface IGetUserProfileUseCase {
  execute(userId: string): Promise<ProfileResponseDTO>;
}
