import { ICompany } from "@/domain/entities/Company";

export interface IGetVerifiedCompaniesUseCase {
  execute(params: {
    query?: string;
    page: number;
    limit: number;
    category?: string[];
    services?: string[];
    companySize?: string;
    minPrice?: number;
    maxPrice?: number;
    minExperience?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    companies: ICompany[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}
