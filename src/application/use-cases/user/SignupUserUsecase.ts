
import { UserSignUp } from "../../../domain/entities/User.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import redisClient from "../../../infrastructure/config/redis.js";
import { OtpService } from "../../providers/OTPService.js";
import bcrypt from "bcryptjs";


//Clearly shows what input the use case expects.
interface RegisterUserRequest{
  name:string;
  email:string;
  phone:string;
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
async execute(data: RegisterUserRequest): Promise<{ message: string }> {
  console.log("STEP 1: execute() received:", data);

  // 🟩 Step 2A: Check for existing LOCAL user
  const existingUser = await this.userRepository.findByEmail(data.email);
  console.log("STEP 2A: After findByEmail(), result:", existingUser);

  if (existingUser) throw new Error("Email already registered");

  // 🟨 Step 2B: Check for existing GOOGLE user
  const existingGoogleUser = await this.userRepository.findGoogleUserByEmail(data.email);
  console.log("STEP 2B: After findGoogleUserByEmail(), result:", existingGoogleUser);

  if (existingGoogleUser) throw new Error("Email already registered");

  // 🟦 Step 3: Prepare temporary user object
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const phoneNumber = data.phone || "";
  const tempUser = new UserSignUp(data.name, data.email, phoneNumber, hashedPassword);

  // 🟪 Step 4: Store temporary user in Redis (10 minutes)
  console.log("STEP 4: Storing temp user in Redis");
  await redisClient.setEx(`tempUser:${data.email}`, 600, JSON.stringify(tempUser));

  // 🟧 Step 5: Generate & send OTP
  console.log("STEP 5: Generating and sending OTP");
  await this.otpService.generateOtp(data.email, OtpPurpose.SIGNUP);

  console.log("STEP 6: OTP sent successfully to user’s email");
  return { message: "OTP sent to email. Please verify to complete signup." };
}

}








