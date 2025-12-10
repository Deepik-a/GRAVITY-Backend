import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { ProfileResponseDTO } from "../../dtos/ProfileResponseDTO.js";
import { IGetUserProfileUseCase } from "../../interfaces/use-cases/user/IGetUserProfileUseCase.js";
import { ProfileMapper } from "../../mappers/ProfileMapper.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";

@injectable()
export class GetUserProfileUseCase implements IGetUserProfileUseCase {
  constructor(  @inject(TYPES.UserRepository) private _userRepository: IAuthRepository) {}

  async execute(userId: string): Promise<ProfileResponseDTO> {
    if (!userId) throw new Error("User ID is required");

    const profile = await this._userRepository.findById(userId);
    if (!profile) throw new Error("User profile not found");

    return ProfileMapper.toResponseDTO(profile);
  }
}
