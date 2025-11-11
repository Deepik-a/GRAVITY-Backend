// import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
// import { OtpService } from "../../providers/OTPService.js";
// import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
// import { UserSignUp } from "../../../domain/entities/User.js";
// import bcrypt from "bcryptjs";
// import redisClient from "../../../infrastructure/config/redis.js";

// interface RegisterUserRequest {
//   name: string;
//   email: string;
//   phone: string;
//   password: string;
//   role: "user" | "company" | "admin"; 
// }

// export class RegisterUserUseCase {
//   private userRepository: IUserRepository;
//   private otpService: OtpService;
//   private role: "user" | "company" | "admin" // 👈 specify type

//   constructor(userRepository: IUserRepository) {
//       this.userRepository = userRepository;
//     this.otpService = new OtpService();
//     this.role=role;
//   }

//   async execute(data: RegisterUserRequest): Promise<{ message: string }> {
//     console.log("STEP 1: Received data:", data);

//     // ✅ Check if email already exists
//     const existingLocal = await this.userRepository.findByEmail(data.email);
//     if (existingLocal) throw new Error("Email already registered");

//     const existingGoogle = await this.userRepository.findGoogleUserByEmail?.(data.email);
//     if (existingGoogle) throw new Error("Email already registered");

//     // ✅ Hash password
//     const hashedPassword = await bcrypt.hash(data.password, 10);

//     // ✅ Apply status only for company
//    let status: "pending" | "verified" | undefined = undefined;
//     if (data.role === "company") {
//       status = "pending"; // <-- only company gets a status
//     }

//     // ✅ Create temp user entity
//     const tempUser = new UserSignUp(
//       data.name,
//       data.email,
//       data.phone || "",
//       hashedPassword,
//       data.role,
//       status // may be undefined for user/admin
//     );

//     // ✅ Save temp data to Redis
//     const redisKey = `tempUser:${data.email}`;
//     await redisClient.setEx(redisKey, 600, JSON.stringify(tempUser));

//     // ✅ Send OTP
//     await this.otpService.generateOtp(data.email, OtpPurpose.SIGNUP);

//     return { message: `OTP sent to ${data.email}. Please verify to complete signup.` };
//   }
// }


/// src/application/use-cases/auth/RegisterUseCase.ts
import { UserSignUp, GoogleSignUp } from "../../../domain/entities/User.js";
import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { OtpService } from "../../providers/OTPService.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import bcrypt from "bcryptjs";
import redisClient from "../../../infrastructure/config/redis.js";
import { UniqueEntityID } from "../../../domain/value-objects/UniqueEntityID.js";

export class RegisterUseCase {
  constructor(
    private repository: IAuthRepository,
    private otpService: OtpService,
    private role: "user" | "company" | "admin"
  ) {}

  async execute(payload: any): Promise<{ message: string }> {
    console.log("🚀 Starting RegisterUseCase.execute");
    console.log("📩 Payload received:", payload);

    // 1️⃣ Check if email already exists in DB
    const existing = await this.repository.findByEmail(payload.email);
    if (existing) {
      console.error("❌ Email already in use:", payload.email);
      throw new Error("Email already in use");
    }

    // 2️⃣ Google signup flow
    if (payload.googleId) {
      const googleUser = new GoogleSignUp(
        payload.name,
        payload.email,
        payload.googleId,
        this.role,
        this.role === "company" ? "pending" : "verified"
      );
      await this.repository.createWithGoogle(googleUser);
      return { message: `${this.role} created with Google` };
    }

    // 3️⃣ Local signup flow
    if (!payload.password) throw new Error("Password required");

    const hashedPassword = await bcrypt.hash(payload.password, 10);

  // ✅ Create temporary user object
const tempUser = new UserSignUp(
  new UniqueEntityID("temp"),       // temporary ID for Redis
  payload.name,                     // full name
  payload.email,                    // email
  hashedPassword,                   // hashed password
  this.role,                        // role: 'user' | 'company' | 'admin'
  payload.phone || "",              // optional phone
  this.role === "company" ? "pending" : undefined // optional status only for company
);

console.log("📦 Temp user entity created:", tempUser);
    console.log("📦 Temp user entity created:", tempUser);

    // ✅ Save temp user in Redis for OTP verification
    const redisKey = `tempUser:${payload.email}`;
    await redisClient.setEx(redisKey, 600, JSON.stringify(tempUser));
    console.log("💾 Temp user saved in Redis");

    // ✅ Send OTP
    await this.otpService.generateOtp(payload.email, OtpPurpose.SIGNUP);
    console.log("📨 OTP sent successfully to:", payload.email);

    return {
      message: `OTP sent to ${payload.email}. Please verify to complete signup.`,
    };
  }
}
