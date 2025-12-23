import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { IGetUserProfileUseCase } from "@/application/interfaces/use-cases/user/IGetUserProfileUseCase";
import { ProfileMapper } from "@/application/mappers/ProfileMapper";
import { GetUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class GetUserProfileUseCase implements IGetUserProfileUseCase {
  constructor(  @inject(TYPES.UserRepository) private _userRepository: IAuthRepository) {}

  async execute(dto: GetUserProfileRequestDto): Promise<ProfileResponseDTO> {
    const { userId } = dto;
    if (!userId) throw new Error("User ID is required");

    const profile = await this._userRepository.findById(userId);
    if (!profile) throw new Error("User profile not found");

    return ProfileMapper.toResponseDTO(profile);
  }
}
