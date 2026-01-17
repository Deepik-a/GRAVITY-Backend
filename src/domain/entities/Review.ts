export interface IReview {
  id?: string;
  companyId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
  userDetails?: {
    name: string;
    profileImage?: string;
  };
}
