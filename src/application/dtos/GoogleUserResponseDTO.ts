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
  token: string;  // ✅ added this
  role?: string;  // optional, if you want role info in response
  status?: string; // optional, if needed
}



