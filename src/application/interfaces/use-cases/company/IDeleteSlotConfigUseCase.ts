export interface IDeleteSlotConfigUseCase {
  execute(companyId: string, ruleId: string): Promise<boolean>;
}
