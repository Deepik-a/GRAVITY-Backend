import { UserProfile } from "@/domain/entities/User";
import { ProfileResponseDTO } from "@/application/dtos/user/ProfileResponseDTO";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";

export const ProfileMapper = {
  // Convert domain entity → DTO
  toResponseDTO(profile: UserProfile): ProfileResponseDTO {
    return new ProfileResponseDTO(
      profile.id.toString(),
      profile.name,
      profile.email,
      profile.profileImage,
      profile.phone,
      profile.location,
      profile.bio,
      profile.isBlocked,
    );
  },

  // Optional: Convert DTO → domain entity (for updates, etc.)
  toDomain(dto: ProfileResponseDTO): UserProfile {
    return new UserProfile(
      new UniqueEntityID(dto.id),
      dto.name,
      dto.email,
      dto.profileImage,
      dto.phone,
      dto.location,
      dto.bio,
      dto.isBlocked,
    );
  }
};
