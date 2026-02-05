export interface IDeleteSlotConfigUseCase {
  execute(companyId: string): Promise<boolean>;
}
