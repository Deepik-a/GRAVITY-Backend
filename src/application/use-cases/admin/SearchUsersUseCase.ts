import { ISearchUsersUseCase } from "@/application/interfaces/use-cases/admin/ISearchUsersUseCase";
import { IAdminRepository } from "@/domain/repositories/IAdminRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";

@injectable()
export class SearchUserUseCase implements ISearchUsersUseCase {
  constructor(
    @inject(TYPES.AdminRepository) private _adminRepository: IAdminRepository
  ) {}

  async execute(query: string, page: number, limit: number) {
    const result = await this._adminRepository.searchUsers(query, page, limit);

    return {
      data: result.data,          //  interface match
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }
}
