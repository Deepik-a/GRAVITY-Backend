import { IRegisterAdminUseCase } from "../../../../application/use-cases/admin/IRegisterAdminUseCase.js";
import { Admin } from "../../../../domain/entities/Admin.js";
import { IAuthController } from "../interfaces/IAuthController.js";



export class AuthController implements IAuthController {

 constructor(
    private registerAdminUseCase:IRegisterAdminUseCase
 ){}
 
  async create(admin: Admin): Promise<Admin> {
    return await this.registerAdminUseCase.execute(admin);
  }

  async findByEmail(email: string): Promise<Admin | null> {
    throw new Error("Method not implemented yet.");
  }
}