import { ICompany } from "../entities/Company";

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
  updateDocumentStatus(
    params: { email?: string; companyId?: string },
    status: "pending" | "verified" | "rejected"
  ): Promise<ICompany>;

  // Save or Update a company (optional)
  save(company: ICompany): Promise<ICompany>;

  // Get all companies
  getAllCompanies(): Promise<ICompany[]>;
}
