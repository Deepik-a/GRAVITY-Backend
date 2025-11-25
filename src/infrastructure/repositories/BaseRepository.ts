// infrastructure/repositories/BaseRepository.ts
import { Model, Document } from "mongoose";
import { IBaseRepository } from "../../domain/repositories/IBaseRepository";
/**
 * Generic BaseRepository wrapping common mongoose operations
 */
export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(payload: Partial<T>): Promise<T> {
    return this.model.create(payload);
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(query: any): Promise<T | null> {
    return this.model.findOne(query).exec();
  }

  async updateById(id: string, updates: any): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { $set: updates }, { new: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id).exec();
    return !!res;
  }
}
