//DTO for Google Authentication


// ✅ dto/VerifiedGoogleUser.ts
export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
}

// ✅ dto/GoogleUserResponseDTO.ts
// src/application/dtos/GoogleUserResponseDTO.ts
export interface GoogleUserResponseDTO {
  name: string;
  email: string;
  googleId: string;
  token: string;
  role: "user" | "company" | "admin"; // include role
  isPending?: boolean; // optional, for company verification
}



