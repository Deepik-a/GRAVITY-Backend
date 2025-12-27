import { CompanyProfile } from "@/domain/entities/User";
import { PaginatedResult } from "@/shared/types/PaginatedResult";

export interface ISearchCompaniesUseCase {
  execute(query: string, page: number, limit: number, status?: string): Promise<PaginatedResult<CompanyProfile>>;
}
