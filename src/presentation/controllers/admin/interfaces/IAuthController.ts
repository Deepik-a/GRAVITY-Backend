import { Admin } from "../../../../domain/entities/Admin.js";

export interface IAuthController{
    create(user: Admin): Promise<Admin>; 
     findByEmail(email: string): Promise<Admin | null>; 
}