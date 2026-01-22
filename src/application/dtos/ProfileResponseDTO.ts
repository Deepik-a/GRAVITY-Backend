import { UserProfile } from "@/domain/entities/User";

export class ProfileResponseDTO {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public profileImage?: string,
    public phone?: string,
    public location?: string,
    public bio?: string,
    public isBlocked?: boolean,
    public role?: string
  ) {}

  // Map from domain entity → DTO
  static fromDomain(profile: UserProfile): ProfileResponseDTO {
    return new ProfileResponseDTO(
      profile.id.toString(), // Convert UniqueEntityID to string
      profile.name,
      profile.email,
      profile.profileImage,
      profile.phone,
      profile.location,
      profile.bio,
      profile.isBlocked,
      profile.role
    );
  }
}
