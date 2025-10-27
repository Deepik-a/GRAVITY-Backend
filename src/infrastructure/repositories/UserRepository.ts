import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { UserSignUp } from "../../domain/entities/User.js";
import { UserResponseDTO } from "../../application/dtos/UserSignUpDTO.js";
import type {UserWithPassword} from '../../domain/repositories/IUserRepository.js'
import UserModel from "../database/models/UserModel.js";
import { ObjectId } from "mongodb";



export class UserRepository implements IUserRepository {

  // Create user and return safe DTO
  async create(user: UserSignUp): Promise<UserResponseDTO> {
    const created = await UserModel.create({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password
    });

    return new UserResponseDTO(
      created._id,
      created.name,
      created.email,
      created.phone
    );
  }

  // Find by email, return internal object including password
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const found = await UserModel.findOne({ email });
    if (!found) return null;

    return {
      _id: found._id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      password: found.password // required for login
    };
  }
}
