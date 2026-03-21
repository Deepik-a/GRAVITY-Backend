export interface ICompanyProfile {
  companyName?: string;
  categories: string[];
  services: string[];
  consultationFee: number;
  establishedYear: number;
  companySize: string;
  overview: string;
  projectsCompleted: number;
  happyCustomers: number;
  awardsWon: number;
  awardsRecognition: string;
  contactOptions: {
    chatSupport: boolean;
    videoCalls: boolean;
  };
  teamMembers: {
    id: number;
    name: string;
    qualification: string;
    role: string;
    photo?: string;
  }[];
  projects: {
    id: number;
    title: string;
    description: string;
    beforeImage?: string;
    afterImage?: string;
    date?: string;
  }[];
  brandIdentity: {
    logo?: string;
    banner1?: string;
    banner2?: string;
    profilePicture?: string;
  };
}

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
  rejectionReason?: string | null;
  subscription?: {
    planId?: string | null;
    status: "active" | "expired" | "cancelled" | "none";
    startDate?: Date | null;
    endDate?: Date | null;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
  };
  location?: string | null;
  isBlocked?: boolean;
  isProfileFilled?: boolean;
  isSubscribed?: boolean;
  walletBalance?: number;
  profile?: ICompanyProfile | null;
}


