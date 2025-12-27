import { IAdmin } from "@/domain/entities/Admin";
import { UserProfile, CompanyProfile } from "@/domain/entities/User";
import { PaginatedResult } from "@/shared/types/PaginatedResult";

export interface IAdminRepository {
    findAdminByEmail(email: string): Promise<IAdmin | null>;
    saveRefreshToken(adminId: string, token: string): Promise<void>;
    searchUsers(query: string, page: number, limit: number): Promise<PaginatedResult<UserProfile>>;
    searchCompanies(query: string, page: number, limit: number, status?: string): Promise<PaginatedResult<CompanyProfile>>;
}
