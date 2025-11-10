import { UserProfile } from "../../domain/entities/User.js";

export class ProfileResponseDTO {
  constructor(
    public userId: string,
    public name: string,
    public email: string,
    public profileImage?: string,
    public phone?: string,
    public location?: string,
    public bio?: string
  ) {}

  // Map from domain entity → DTO
  static fromDomain(profile: UserProfile): ProfileResponseDTO {
    return new ProfileResponseDTO(
      profile.userId.toString(), // Convert UniqueEntityID to string
      profile.name,
      profile.email,
      profile.profileImage,
      profile.phone,
      profile.location,
      profile.bio
    );
  }
}
