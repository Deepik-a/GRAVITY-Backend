import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { ProfileMapper } from "@/application/mappers/ProfileMapper";

import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUpdateUserProfileUseCase } from "@/application/interfaces/use-cases/user/IUpdateUserProfileUseCase";
import { UpdateUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";
import { Messages } from "@/shared/constants/message";




@injectable()
export class UpdateUserProfileUseCase implements IUpdateUserProfileUseCase {
  constructor( @inject(TYPES.AuthRepository) private _userRepository: IAuthRepository) {}

  async execute(dto: UpdateUserProfileRequestDto): Promise<ProfileResponseDTO> {
    if (!dto.id) throw new Error(Messages.USER.USER_ID_REQUIRED);

    //  Separate ID from updates to avoid trying to update the _id field
    const { id, ...updates } = dto;

    const updated = await this._userRepository.updateUserProfile(
      id,
      updates
    );

    if (!updated) throw new Error(Messages.USER.PROFILE_UPDATE_FAILED);

    return ProfileMapper.toResponseDTO(updated);
  }
}
