import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { ProfileResponseDTO } from "../../dtos/ProfileResponseDTO.js";
import { ProfileMapper } from "../../mappers/ProfileMapper.js";
import { UniqueEntityID } from "../../../domain/value-objects/UniqueEntityID.js";

interface UpdateProfileInput {
  userId: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export class UpdateUserProfileUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: UpdateProfileInput): Promise<ProfileResponseDTO> {
    if (!data.userId) throw new Error("User ID is required");

    // ✅ Convert string to UniqueEntityID before updating
    const uniqueId = new UniqueEntityID(data.userId);

    const updated = await this.userRepository.updateUserProfile(
      data.userId,
      {
        ...data,
        userId: uniqueId, // ✅ pass domain value object
      }
    );

    if (!updated) throw new Error("Failed to update profile");

    return ProfileMapper.toResponseDTO(updated);
  }
}
