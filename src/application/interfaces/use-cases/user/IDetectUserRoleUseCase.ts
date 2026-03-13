import { DetectRoleResponseDto } from "@/application/dtos/AuthDTOs";

export interface IDetectUserRoleUseCase {
  execute(email: string): Promise<DetectRoleResponseDto>;
}
