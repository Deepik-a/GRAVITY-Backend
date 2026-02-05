export interface IToggleFavouriteUseCase {
  execute(userId: string, companyId: string): Promise<string[]>;
}
