// application/dtos/AuthDTOs.ts
export interface SignupDTO {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
}

export interface LoginDTO {
  email: string;
  password?: string;
  googleId?: string;
}

export interface AuthResponseDTO {
  message: string;
  token?: string;
  refreshToken?: string;
  role?:string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
}
