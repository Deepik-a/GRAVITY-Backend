export interface VerifyCompanyRequestDto {
  companyId: string;
  approve: boolean;
  reason?: string;
}
