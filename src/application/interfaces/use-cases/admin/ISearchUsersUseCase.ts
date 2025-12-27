import { UserProfile } from "@/domain/entities/User";
import { PaginatedResult } from "@/shared/types/PaginatedResult";

export interface ISearchUsersUseCase {
  execute(query: string, page: number, limit: number): Promise<PaginatedResult<UserProfile>>;
}
