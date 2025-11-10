import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { ProfileResponseDTO } from "../../dtos/ProfileResponseDTO.js";
import { ProfileMapper } from "../../mappers/ProfileMapper.js";

export class GetUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<ProfileResponseDTO> {
    if (!userId) throw new Error("User ID is required");

    const profile = await this.userRepository.findById(userId);
    if (!profile) throw new Error("User profile not found");

    return ProfileMapper.toResponseDTO(profile);
  }
}
