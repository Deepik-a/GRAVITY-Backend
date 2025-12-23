import { GoogleSignUp } from "@/domain/entities/User";
import { GoogleUserResponseDto } from "@/application/dtos/AuthDTOs";

export const GoogleUserMapper = {
  toResponseDTO(
    user: GoogleSignUp,
    token: string
  ): GoogleUserResponseDto {
    return {
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      token,
      role: user.role, 
      documentStatus: user.documentStatus, 
    };
  }
};
