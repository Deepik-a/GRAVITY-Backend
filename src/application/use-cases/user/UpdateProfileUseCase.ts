import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { ProfileMapper } from "@/application/mappers/ProfileMapper";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

interface UpdateProfileInput {
  id: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
}
import { IUpdateUserProfileUseCase } from "@/application/interfaces/use-cases/user/IUpdateUserProfileUseCase";
import { Messages } from "@/shared/constants/message";

@injectable()
export class UpdateUserProfileUseCase implements IUpdateUserProfileUseCase {
  constructor( @inject(TYPES.AuthRepository) private _userRepository: IAuthRepository) {}

  async execute(data: UpdateProfileInput): Promise<ProfileResponseDTO> {
    if (!data.id) throw new Error(Messages.USER.USER_ID_REQUIRED);

    //  Convert string to UniqueEntityID before updating
    const uniqueId = new UniqueEntityID(data.id);

    const updated = await this._userRepository.updateUserProfile(
      data.id,
      {
        ...data,
        id: uniqueId, //  pass domain value object
      }
    );

    if (!updated) throw new Error(Messages.USER.PROFILE_UPDATE_FAILED);

    return ProfileMapper.toResponseDTO(updated);
  }
}
