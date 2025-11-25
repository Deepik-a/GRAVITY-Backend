export interface IAdmin {
  id: string;          // Use string instead of ObjectId in domain
  email: string;
  password: string;
  role: "admin";
  refreshToken?: string;
}
