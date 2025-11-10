export interface IGetRepositoryDataUseCase<Entity> {
  OneDocumentById(id: string): Promise<Entity | null>;
}
