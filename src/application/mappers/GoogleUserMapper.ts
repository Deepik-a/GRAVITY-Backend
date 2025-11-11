import { GoogleSignUp } from "../../domain/entities/User.js";
import { GoogleUserResponseDTO } from "../dtos/GoogleUserResponseDTO.js";

export class GoogleUserMapper {
  static toResponseDTO(
    user: GoogleSignUp,
    token: string
  ): GoogleUserResponseDTO {
    return {
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      token,
    };
  }
}
