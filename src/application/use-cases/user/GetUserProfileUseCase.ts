import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { IGetUserProfileUseCase } from "@/application/interfaces/use-cases/user/IGetUserProfileUseCase";
import { ProfileMapper } from "@/application/mappers/ProfileMapper";
import { GetUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { Messages } from "@/shared/constants/message";

@injectable()
export class GetUserProfileUseCase implements IGetUserProfileUseCase {
  constructor(
    @inject(TYPES.UserRepository) private _userRepository: IAuthRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: IAuthRepository
  ) {}

  async execute(dto: GetUserProfileRequestDto): Promise<ProfileResponseDTO> {
    const { id, role } = dto;
    if (!id) throw new Error(Messages.USER.USER_ID_REQUIRED);

    const repo = role === "company" ? this._companyRepository : this._userRepository;
    const profile = await repo.findById(id);
    
    if (!profile) throw new Error(Messages.USER.NOT_FOUND);

    return ProfileMapper.toResponseDTO(profile);
  }
}
