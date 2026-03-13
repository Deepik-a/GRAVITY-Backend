import { ToggleBlockStatusRequestDto } from "@/application/dtos/admin/ToggleBlockStatusRequestDto";
import { UserProfile } from "@/domain/entities/User";

export interface IToggleUserBlockStatusUseCase {
  execute(data: ToggleBlockStatusRequestDto): Promise<UserProfile>;
}
