import { ChangePasswordDto } from "@/application/dtos/AuthDTOs";

export interface IChangePasswordUseCase {
  execute(userId: string, data: ChangePasswordDto): Promise<void>;
}
