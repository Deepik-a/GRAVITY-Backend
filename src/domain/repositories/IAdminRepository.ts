import { IAdmin } from "@/domain/entities/Admin";
import { UserProfile, CompanyProfile } from "@/domain/entities/User";
import { PaginatedResult } from "@/shared/types/PaginatedResult";

export interface IAdminRepository {
    findAdminByEmail(email: string): Promise<IAdmin | null>;
    saveRefreshToken(adminId: string, token: string): Promise<void>;
    searchUsers(query: string, page: number, limit: number): Promise<PaginatedResult<UserProfile>>;
    searchCompanies(query: string, page: number, limit: number, status?: string): Promise<PaginatedResult<CompanyProfile>>;
    getDashboardStats(): Promise<IDashboardStats>;
}

export interface IDashboardStats {
  totalUsers: number;
  totalCompanies: number;
  totalBookings: number;
  pendingVerifications: number;
  grossRevenue: number;
  netRevenue: number;
  activeSubscriptions: {
    users: number;
    companies: number;
  };
  userGrowth: {
    users: { month: string; count: number }[];
    companies: { month: string; count: number }[];
  };
  revenueBreakdown: { label: string; value: number }[];
  recentActivities: {
    icon: string;
    title: string;
    description: string;
    time: string;
  }[];
}
