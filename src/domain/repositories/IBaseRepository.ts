// domain/repositories/IBaseRepository.ts
export interface IBaseRepository<T> {
  create(payload: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(query: any): Promise<T | null>;
  updateById(id: string, updates: any): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
}
