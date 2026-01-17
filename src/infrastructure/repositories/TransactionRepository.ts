import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import TransactionModel, { ITransactionDocument } from "@/infrastructure/database/models/TransactionModel";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { ITransaction } from "@/domain/entities/Transaction";
import { injectable } from "inversify";

@injectable()
export class TransactionRepository extends BaseRepository<ITransactionDocument> implements ITransactionRepository {
  constructor() {
    super(TransactionModel);
  }

  async createTransaction(transaction: ITransaction): Promise<ITransaction> {
    const created = await this.model.create(transaction);
    return this._mapToEntity(created.toObject());
  }

  async findByCompanyId(companyId: string): Promise<ITransaction[]> {
    const transactions = await this.model.find({ toCompany: companyId })
      .sort({ createdAt: -1 })
      .lean();
    return transactions.map(t => this._mapToEntity(t));
  }

  async findAll(): Promise<ITransaction[]> {
    const transactions = await this.model.find()
      .populate("toCompany")
      .populate("fromUser")
      .sort({ createdAt: -1 })
      .lean();
    return transactions.map(t => this._mapToEntity(t));
  }

  private _mapToEntity(doc: unknown): ITransaction {
    const d = doc as any;
    return {
      id: d._id.toString(),
      bookingId: d.bookingId?.toString(),
      type: d.type,
      amount: d.amount,
      status: d.status,
      fromUser: d.fromUser?._id ? d.fromUser._id.toString() : d.fromUser?.toString(),
      toCompany: d.toCompany?._id ? d.toCompany._id.toString() : d.toCompany?.toString(),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
