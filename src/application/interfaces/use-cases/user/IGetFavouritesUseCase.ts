import { ICompany } from "@/domain/entities/Company";

export interface IGetFavouritesUseCase {
  execute(userId: string): Promise<ICompany[]>;
}
