export interface SignupRequestDto {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  phone: string;
  role: "user" | "company";
}
