import {ObjectId} from "mongodb"
import { UserSignUp } from "../../domain/entities/User.js"

export class UserResponseDTO{
    constructor(
  public _id:ObjectId,
  public name:string,
  public email:string,
  public phone:string
    ){}

    static fromDomain(user:UserSignUp,id: ObjectId):UserResponseDTO {
        return new UserResponseDTO (id,user.name,user.email,user.phone);
    }
}