import { Request, Response, NextFunction } from "express";
import { IAdminLoginUseCase } from "../../../application/interfaces/use-cases/admin/IAdminLoginUseCase";
import { StatusCode } from "../../../domain/enums/StatusCode";
import { IGetAllUsersUseCase } from "../../../application/interfaces/use-cases/admin/IGetAllUsersUseCase";
import { IGetAllCompaniesUseCase } from "../../../application/interfaces/use-cases/admin/IGetAllCompaniesUseCase";
import { IVerifyCompanyUseCase } from "../../../application/interfaces/use-cases/admin/IVerifyCompanyUseCase";

export class AdminLoginController {
 constructor(private readonly _adminLoginUseCase: IAdminLoginUseCase,
  private readonly _getAllUsersUseCase: IGetAllUsersUseCase,
  private readonly _getAllCompaniesUseCase: IGetAllCompaniesUseCase,
  private readonly _verifyCompanyUseCase:IVerifyCompanyUseCase
 ) {}


  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this._adminLoginUseCase.execute(email, password);

      return res.status(StatusCode.SUCCESS).json({
        message: result.message,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        role: "admin",
      });
    } catch (error) {
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
      const { companyId, approve } = req.body;
console.log("req.body from verifycompany",req.body)
      if (!companyId || approve === undefined) {
        return res.status(400).json({ message: "companyId and approve are required" });
      }

      const updatedCompany = await this._verifyCompanyUseCase.execute(companyId, approve);

      return res.json({
        message: `Company ${approve ? "approved" : "rejected"} successfully`,
        company: updatedCompany,
      });
    } catch (err) {
      next(err);
    }
  }

}
