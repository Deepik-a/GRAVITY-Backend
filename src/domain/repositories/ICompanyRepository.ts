import { ICompany } from "@/domain/entities/Company";

export interface ICompanyRepository {

  // Update all 3 documents by email
  updateDocuments(
    email: string,
    docs: {
      GST_Certificate?: string | null;
      RERA_License?: string | null;
      Trade_License?: string | null;
    }
  ): Promise<ICompany>;

  // Update only documentStatus by email or companyId
// Interface / Repository signature
updateDocumentStatus(
  params: { email?: string; companyId?: string },
  status: "pending" | "verified" | "rejected",
  reason?: string // ✅ add optional reason
): Promise<ICompany>;

  // Save or Update a company (optional)
  save(company: ICompany): Promise<ICompany>;

  // Get all companies
  getAllCompanies(): Promise<ICompany[]>;

  // Update block status
  updateBlockStatus(companyId: string, isBlocked: boolean): Promise<ICompany | null>;

  // Profile methods
  updateProfile(companyId: string, profileData: NonNullable<ICompany["profile"]>): Promise<ICompany | null>;
  deleteProfile(companyId: string): Promise<ICompany | null>;
  getProfile(companyId: string): Promise<ICompany | null>;

  // Get companies with search, filter, pagination, and sort
  getCompanies(params: {
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

  updateSubscription(companyId: string, subscription: unknown): Promise<void>;
  findCompanyById(id: string): Promise<ICompany | null>;
  update(id: string, updates: Partial<ICompany>): Promise<ICompany | null>;
}


