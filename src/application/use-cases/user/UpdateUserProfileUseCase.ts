import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { ProfileMapper } from "@/application/mappers/ProfileMapper";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUpdateUserProfileUseCase } from "@/application/interfaces/use-cases/user/IUpdateUserProfileUseCase";
import { UpdateUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";




@injectable()
export class UpdateUserProfileUseCase implements IUpdateUserProfileUseCase {
  constructor( @inject(TYPES.AuthRepository) private _userRepository: IAuthRepository) {}

  async execute(dto: UpdateUserProfileRequestDto): Promise<ProfileResponseDTO> {
    if (!dto.userId) throw new Error("User ID is required");

    // ✅ Convert string to UniqueEntityID before updating
    const uniqueId = new UniqueEntityID(dto.userId);

    const updated = await this._userRepository.updateUserProfile(
      dto.userId,
      {
        ...dto,
        userId: uniqueId, // ✅ pass domain value object
      }
    );

    if (!updated) throw new Error("Failed to update profile");

    return ProfileMapper.toResponseDTO(updated);
  }
}
