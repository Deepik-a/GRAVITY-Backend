import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";


import { IDetectUserRoleUseCase } from "@/application/interfaces/use-cases/user/IDetectUserRoleUseCase";
import { DetectRoleResponseDto } from "@/application/dtos/AuthDTOs";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

//Admin@123
@injectable()
export class DetectUserRoleUseCase implements IDetectUserRoleUseCase {
  constructor(
     @inject(TYPES.UserRepository) private _userRepository: IAuthRepository,
     @inject(TYPES.CompanyRepository) private _companyRepository: IAuthRepository,
  ) {}

  async execute(email: string): Promise<DetectRoleResponseDto> {
    if (!email) throw new AppError("Email is required", StatusCode.BAD_REQUEST);


   const company = await this._companyRepository.findByEmail(email);

    if (company) {
      return {
        repo: this._companyRepository,
        role: "company",
        user: company,
        isNewUser: false,
      };
    }


    const user = await this._userRepository.findByEmail(email);

    if (user) {
      return {
        repo: this._userRepository,
        role: "user",
        user,
        isNewUser: false,
      };
    }

    return {
      repo: null,
      role: null,
      user: null,
      isNewUser: true,
    };
  }
}
