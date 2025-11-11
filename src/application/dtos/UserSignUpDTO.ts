import { UserSignUp } from "../../domain/entities/User.js";

export class UserResponseDTO {
  constructor(
    public id: string,      // ✅ API should use string
    public name: string,
    public email: string,
    public phone?: string
  ) {}

  // ✅ Factory method to convert from domain entity
  static fromDomain(user: UserSignUp): UserResponseDTO {
    return new UserResponseDTO(
      user.id.toString(),   // convert UniqueEntityID → string
      user.name,
      user.email,
      user.phone ?? ""
    );
  }
}
