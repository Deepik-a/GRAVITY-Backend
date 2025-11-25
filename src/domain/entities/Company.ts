export interface ICompany {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "user" | "company";
  status: "verified" | "pending";

  documents: {
    GST_Certificate?: string | null;
    RERA_License?: string | null;
    Trade_License?: string | null;
  };

  documentStatus: "pending" | "verified" | "rejected";
}

