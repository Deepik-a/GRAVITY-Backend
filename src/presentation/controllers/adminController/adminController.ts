import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types"
import { IAdminLoginUseCase } from "../../../application/interfaces/use-cases/admin/IAdminLoginUseCase";
import { StatusCode } from "../../../domain/enums/StatusCode";
import { IGetAllUsersUseCase } from "../../../application/interfaces/use-cases/admin/IGetAllUsersUseCase";
import { IGetAllCompaniesUseCase } from "../../../application/interfaces/use-cases/admin/IGetAllCompaniesUseCase";
import { IVerifyCompanyUseCase } from "../../../application/interfaces/use-cases/admin/IVerifyCompanyUseCase";
import { cookieData } from "../../../shared/constants/cookieData";


@injectable()
export class AdminLoginController {
 constructor(
  @inject(TYPES.AdminLoginUseCase) private readonly _adminLoginUseCase: IAdminLoginUseCase,
   @inject(TYPES.GetAllUsersUseCase) private readonly _getAllUsersUseCase: IGetAllUsersUseCase,
  @inject(TYPES.GetAllCompaniesUseCase)  private readonly _getAllCompaniesUseCase: IGetAllCompaniesUseCase,
   @inject(TYPES.VerifyCompanyUseCase) private readonly _verifyCompanyUseCase:IVerifyCompanyUseCase
 ) {}


 async login(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("🟦 Admin Login Controller Hit");

    const { email, password } = req.body;
    console.log("📨 Incoming Credentials:", { email });

    // Call use case
    const result = await this._adminLoginUseCase.execute(email, password);
    console.log("✅ Use case returned tokens successfully");
    console.log("🔐 Access Token:", result.accessToken);
    console.log("🔐 Refresh Token:", result.refreshToken);

    // Cookie creation logs
    console.log("🍪 Setting access token cookie with options:", {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
    });

    res.cookie("accessToken", result.accessToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
    });

    console.log("🍪 Setting refresh token cookie with options:", {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_REFRESH_TOKEN,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_REFRESH_TOKEN,
    });

    console.log("📤 Sending success response");

    return res.status(StatusCode.SUCCESS).json({
      message: result.message,
    });

  } catch (error) {
    console.log("❌ Error in admin login controller:", error);
    next(error);
  }
}


    async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this._getAllUsersUseCase.execute();
      res.status(StatusCode.SUCCESS).json({ users });
    } catch (err) {
      next(err);
    }
  }

    async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const companies = await this._getAllCompaniesUseCase.execute();
      return res.status(StatusCode.SUCCESS).json({ companies });
    } catch (err) {
      next(err);
    }
  }

async verifyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId, approve,reason } = req.body;
console.log("req.body from verifycompany",req.body)
      if (!companyId || approve === undefined) {
        return res.status(400).json({ message: "companyId and approve are required" });
      }

      const updatedCompany = await this._verifyCompanyUseCase.execute(companyId, approve,reason);

      return res.json({
        message: `Company ${approve ? "approved" : "rejected"} successfully`,
        company: updatedCompany,
      });
    } catch (err) {
      next(err);
    }
  }

}
