export interface CompanyResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  documentStatus: string;
  rejectionReason?: string | null;
  documents?: {
    GST_Certificate?: string | null;
    RERA_License?: string | null;
    Trade_License?: string | null;
  };
}
