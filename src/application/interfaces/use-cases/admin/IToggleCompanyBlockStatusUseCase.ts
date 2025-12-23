import { ToggleBlockStatusRequestDto } from "@/application/dtos/admin/ToggleBlockStatusRequestDto";
import { ICompany } from "@/domain/entities/Company";

export interface IToggleCompanyBlockStatusUseCase {
  execute(data: ToggleBlockStatusRequestDto): Promise<ICompany>;
}
