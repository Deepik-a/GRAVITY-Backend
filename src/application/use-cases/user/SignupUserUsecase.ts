// import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
// import { UserSignUp } from "../../../domain/entities/User.js";
// import { UserResponseDTO } from "../../dtos/UserSignUpDTO.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken"

import { UserSignUp } from "../../../domain/entities/User.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import redisClient from "../../../infrastructure/config/redis.js";
import { OtpService } from "../../providers/OTPService.js";
import bcrypt from "bcryptjs";

// interface RegisterUserRequest {
//   name: string;
//   email: string;
//   phone?: string;
//   password: string;
// }


// export class RegisterUserUseCase {
//   constructor(private userRepository: IUserRepository) {}

//  async execute(data: RegisterUserRequest): Promise<{ user: UserResponseDTO; token: string }> {
//   console.log("STEP 1: Inside execute(), received:", data);

//   const existingUser = await this.userRepository.findByEmail(data.email);
//   console.log("STEP 2: After findByEmail(), result:", existingUser);

//   if (existingUser) throw new Error("Email already in use");

//   console.log("STEP 3: Creating user model");
//   const hashedPassword = await bcrypt.hash(data.password, 10);
//   const phoneNumber = data.phone || "";
//   const user = new UserSignUp(data.name, data.email, phoneNumber, hashedPassword);

//   console.log("STEP 4: Before calling repository.create()");
//   const createdUser = await this.userRepository.create(user);

//   console.log("STEP 5: After repository.create()");

//   const token = jwt.sign({ id: createdUser.email, role: "user" }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });

//   console.log(token,"STEP 6: Returning response with token generated");
//   return { user: createdUser, token };
// }

// }


//Clearly shows what input the use case expects.
interface RegisterUserRequest{
  name:string;
  email:string;
  phone?:string;
  password:string;
}


export class RegisterUserUseCase{

  //private is an access modifier in TypeScript,that is unlike public they are not accessible outside class
//methods inside the RegisterUserUseCase class can use them,cannot access from outside
  private otpService: OtpService;
  private userRepository: IUserRepository

//constructor is a special method that runs automatically when an instance of the class is created
//in receives one argument as IUserRepository,so when an object is created with the class,it should pass an argument to that object
constructor( userRepository: IUserRepository){
    this.otpService = new OtpService();
    this.userRepository = userRepository;
}

//execute() function returns an object {message:""} that is resolved by a Promise as we are using async keyword
async execute(data:RegisterUserRequest):Promise<{message:string}>{
      console.log("STEP 1: execute() received:", data);

const existingUser=await this.userRepository.findByEmail(data.email);
console.log("STEP 2: After findByEmail(), result:", existingUser);
  if (existingUser) throw new Error("Email already in use");


    // Step 3: Prepare temporary user object
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const phoneNumber = data.phone || "";
    const tempUser = new UserSignUp(data.name, data.email, phoneNumber, hashedPassword);

      // Step 4: Store temporary user in Redis
    console.log("STEP 4: Storing temp user in Redis");
    await redisClient.setEx(
      `tempUser:${data.email}`,
      600, // 10 minutes expiry
      JSON.stringify(tempUser)
    );
 

 // Step 5: Generate & send OTP
    console.log("STEP 5: Generating and sending OTP");
    await this.otpService.generateOtp(data.email, OtpPurpose.SIGNUP);

 // Step 5: Generate & send OTP
    console.log("STEP 5: Generating and sending OTP");
    await this.otpService.generateOtp(data.email, OtpPurpose.SIGNUP);

     console.log("STEP 6: OTP sent successfully to user’s email");
    return { message: "OTP sent to email. Please verify to complete signup." };

  }
}








