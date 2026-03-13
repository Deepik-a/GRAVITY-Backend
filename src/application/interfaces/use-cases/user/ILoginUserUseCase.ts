import { LoginResponseDto } from "@/application/dtos/AuthDTOs";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { IAdminRepository } from "@/domain/repositories/IAdminRepository";

export interface AuthenticatableUser {
  id: string | { toString(): string };
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  documentStatus?: string;
  rejectionReason?: string | null;
  isBlocked?: boolean;
  isProfileFilled?: boolean;
  isSubscribed?: boolean;
  provider?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
  repo: IAuthRepository | IAdminRepository;
  role: "user" | "company" | "admin";
  user: AuthenticatableUser;
}

export interface ILoginUserUseCase {
  execute(input: LoginInput): Promise<LoginResponseDto>;
}
