import { UserProfile } from "../../domain/entities/User.js";
import { ProfileResponseDTO } from "../dtos/ProfileResponseDTO.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";

export class ProfileMapper {
  // Convert domain entity → DTO
  static toResponseDTO(profile: UserProfile): ProfileResponseDTO {
    return new ProfileResponseDTO(
      profile.userId.toString(),
      profile.name,
      profile.email,
      profile.profileImage,
      profile.phone,
      profile.location,
      profile.bio
    );
  }

  // Optional: Convert DTO → domain entity (for updates, etc.)
  static toDomain(dto: ProfileResponseDTO): UserProfile {
    return new UserProfile(
      new UniqueEntityID(dto.userId),
      dto.name,
      dto.email,
      dto.profileImage,
      dto.phone,
      dto.location,
      dto.bio
    );
  }
}
