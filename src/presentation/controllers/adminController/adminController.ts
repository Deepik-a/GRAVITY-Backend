import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IAdminLoginUseCase } from "@/application/interfaces/use-cases/admin/IAdminLoginUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { IGetAllUsersUseCase } from "@/application/interfaces/use-cases/admin/IGetAllUsersUseCase";
import { IGetAllCompaniesUseCase } from "@/application/interfaces/use-cases/admin/IGetAllCompaniesUseCase";
import { IVerifyCompanyUseCase } from "@/application/interfaces/use-cases/admin/IVerifyCompanyUseCase";
import { cookieData } from "@/shared/constants/cookieData";
import { AdminLoginRequestDto } from "@/application/dtos/admin/AdminLoginRequestDto";
import { VerifyCompanyRequestDto } from "@/application/dtos/admin/VerifyCompanyRequestDto";
import { UserListResponseDto } from "@/application/dtos/admin/UserListResponseDto";
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";
import { IToggleUserBlockStatusUseCase } from "@/application/interfaces/use-cases/admin/IToggleUserBlockStatusUseCase";
import { IToggleCompanyBlockStatusUseCase } from "@/application/interfaces/use-cases/admin/IToggleCompanyBlockStatusUseCase";
import { ILogger } from "@/domain/services/ILogger";
import { AdminLoginResponseDto } from "@/application/dtos/admin/AdminLoginResponseDto";
import { ISearchUsersUseCase } from "@/application/interfaces/use-cases/admin/ISearchUsersUseCase";
import { ISearchCompaniesUseCase } from "@/application/interfaces/use-cases/admin/ISearchCompaniesUseCase";
import { Messages } from "@/shared/constants/message";

// ... existing imports

@injectable()
export class AdminLoginController {
  constructor(
    @inject(TYPES.AdminLoginUseCase)
    private readonly _adminLoginUseCase: IAdminLoginUseCase,
    @inject(TYPES.GetAllUsersUseCase)
    private readonly _getAllUsersUseCase: IGetAllUsersUseCase,
    @inject(TYPES.GetAllCompaniesUseCase)
    private readonly _getAllCompaniesUseCase: IGetAllCompaniesUseCase,
    @inject(TYPES.VerifyCompanyUseCase)
    private readonly _verifyCompanyUseCase: IVerifyCompanyUseCase,
    @inject(TYPES.ToggleUserBlockStatusUseCase)
    private readonly _toggleUserBlockStatusUseCase: IToggleUserBlockStatusUseCase,
    @inject(TYPES.ToggleCompanyBlockStatusUseCase)
    private readonly _toggleCompanyBlockStatusUseCase: IToggleCompanyBlockStatusUseCase,
    @inject(TYPES.SearchUserUseCase)
    private readonly _searchUsersUseCase: ISearchUsersUseCase,
    @inject(TYPES.SearchCompanyUseCase)
    private readonly _searchCompaniesUseCase: ISearchCompaniesUseCase,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  // ... existing methods

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      this._logger.info("🟦 Admin Login Controller Hit");

      const loginDto: AdminLoginRequestDto = req.body;
      const result: AdminLoginResponseDto =
        await this._adminLoginUseCase.execute(loginDto);

      // ✅ Admin Specific Cookies
      res.cookie("adminAccessToken", result.accessToken, {
        httpOnly: cookieData.httpONLY,
        secure: cookieData.SECURE,
        sameSite: cookieData.SAME_SITE,
        maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
        path: "/",
      });

      res.cookie("adminRefreshToken", result.refreshToken, {
        httpOnly: cookieData.httpONLY,
        secure: cookieData.SECURE,
        sameSite: cookieData.SAME_SITE,
        maxAge: cookieData.MAX_AGE_REFRESH_TOKEN,
        path: "/",
      });

      return res.status(StatusCode.SUCCESS).json({
        message: result.message,
      });
    } catch (error) {
      this._logger.error("❌ Error in admin login controller:", { error });
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users: UserListResponseDto[] =
        await this._getAllUsersUseCase.execute();
      res.status(StatusCode.SUCCESS).json({ users });
    } catch (err) {
      next(err);
    }
  }

  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const companies: CompanyResponseDto[] =
        await this._getAllCompaniesUseCase.execute();
      return res.status(StatusCode.SUCCESS).json({ companies });
    } catch (err) {
      next(err);
    }
  }

  async verifyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const verifyDto: VerifyCompanyRequestDto = req.body;
      this._logger.info("📨 Verify Company Request:", { verifyDto });

      if (!verifyDto.companyId || verifyDto.approve === undefined) {
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: "companyId and approve are required" });
      }

      const updatedCompany: CompanyResponseDto =
        await this._verifyCompanyUseCase.execute(verifyDto);

      return res.status(StatusCode.SUCCESS).json({
        message: `Company ${
          verifyDto.approve ? "approved" : "rejected"
        } successfully`,
        company: updatedCompany,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleUserBlockStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, isBlocked } = req.body;
      if (!id || isBlocked === undefined) {
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: "id and isBlocked are required" });
      }
      const result = await this._toggleUserBlockStatusUseCase.execute({
        id,
        isBlocked,
      });
      return res
        .status(StatusCode.SUCCESS)
        .json({
          message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
          user: result,
        });
    } catch (error) {
      next(error);
    }
  }

  async toggleCompanyBlockStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, isBlocked } = req.body;
      if (!id || isBlocked === undefined) {
        return res
          .status(StatusCode.BAD_REQUEST)
          .json({ message: "id and isBlocked are required" });
      }
      const result = await this._toggleCompanyBlockStatusUseCase.execute({
        id,
        isBlocked,
      });
      return res
        .status(StatusCode.SUCCESS)
        .json({
          message: `Company ${
            isBlocked ? "blocked" : "unblocked"
          } successfully`,
          company: result,
        });
    } catch (error) {
      next(error);
    }
  }

  async SearchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || "";
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

    const result = await this._searchUsersUseCase.execute(query, page, limit);

    return res.status(StatusCode.SUCCESS).json({
      message: Messages.USER.USERSEARCH_SUCCESS,
      users: result.data,        // ✅ mapping here
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    });
  } catch (err) {
    next(err);
  }
}


  async searchCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || "";
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const status = (req.query.status as string) || "all";
      const result = await this._searchCompaniesUseCase.execute(query, page, limit, status);
      return res
        .status(StatusCode.SUCCESS)
        .json({ 
          message: "Companies searched successfully", 
          companies: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        });
    } catch (err) {
      next(err);
    }
  }
}
