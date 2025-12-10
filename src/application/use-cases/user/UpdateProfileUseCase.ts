import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { ProfileResponseDTO } from "../../dtos/ProfileResponseDTO.js";
import { ProfileMapper } from "../../mappers/ProfileMapper.js";
import { UniqueEntityID } from "../../../domain/value-objects/UniqueEntityID.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";

interface UpdateProfileInput {
  userId: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
}
@injectable()
export class UpdateUserProfileUseCase {
  constructor( @inject(TYPES.AuthRepository) private _userRepository: IAuthRepository) {}

  async execute(data: UpdateProfileInput): Promise<ProfileResponseDTO> {
    if (!data.userId) throw new Error("User ID is required");

    // ✅ Convert string to UniqueEntityID before updating
    const uniqueId = new UniqueEntityID(data.userId);

    const updated = await this._userRepository.updateUserProfile(
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
