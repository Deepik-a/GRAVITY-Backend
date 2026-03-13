export interface IGetAvailableSlotsUseCase {
  execute(companyId: string, dateStr: string): Promise<string[]>;
}
