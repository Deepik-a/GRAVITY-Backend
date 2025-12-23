// domain/repositories/IBaseRepository.ts
export interface IBaseRepository<T> {
  create(payload: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(query: Record<string, unknown>): Promise<T | null>;
  updateById(id: string, updates: Record<string, unknown>): Promise<T | null>;
  deleteById(id: string): Promise<boolean>;
}
