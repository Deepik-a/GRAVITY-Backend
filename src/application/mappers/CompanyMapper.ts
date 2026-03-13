import { ICompany } from "@/domain/entities/Company";
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";

export const CompanyMapper = {
  toResponseDTO(company: ICompany): CompanyResponseDto {
    return {
      id: company.id.toString(),
      name: company.name,
      email: company.email,
      phone: company.phone ?? null,
      location: company.location ?? null,
      documentStatus: company.documentStatus,
      rejectionReason: company.rejectionReason ?? null,
      documents: company.documents
    };
  }
};
