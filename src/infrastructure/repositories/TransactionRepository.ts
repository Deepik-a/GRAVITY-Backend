import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import TransactionModel, { ITransactionDocument } from "@/infrastructure/database/models/TransactionModel";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { ITransaction } from "@/domain/entities/Transaction";
import { injectable } from "inversify";
import { TransactionMapper } from "@/application/mappers/TransactionMapper";


@injectable()
export class TransactionRepository extends BaseRepository<ITransactionDocument> implements ITransactionRepository {
  constructor() {
    super(TransactionModel);
  }

  async createTransaction(transaction: ITransaction): Promise<ITransaction> {
    const created = await this.model.create(transaction);
    return TransactionMapper.toEntity(created.toObject());
  }

  async findTransactionById(id: string): Promise<ITransaction | null> {
    const transaction = await this.model.findById(id)
      .populate("userId", "name email")
      .populate("companyId", "name email")
      .populate("bookingId")
      .populate("subscriptionPlanId")
      .lean();
    
    return transaction ? TransactionMapper.toEntity(transaction) : null;
  }

  async findByCompanyId(companyId: string): Promise<ITransaction[]> {
    const transactions = await this.model.find({ companyId })
      .populate("userId", "name email")
      .populate("companyId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return transactions.map(t => TransactionMapper.toEntity(t));
  }

  async findByUserId(userId: string): Promise<ITransaction[]> {
    const transactions = await this.model.find({ userId })
      .populate("userId", "name email")
      .populate("companyId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    return transactions.map(t => TransactionMapper.toEntity(t));
  }

  async findAll(filters?: {
    type?: string;
    status?: string;
    userId?: string;
    companyId?: string;
    bookingId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ITransaction[]> {
    const query: Record<string, any> = {};
    
    if (filters) {
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.userId) query.userId = filters.userId;
      if (filters.companyId) query.companyId = filters.companyId;
      if (filters.bookingId) query.bookingId = filters.bookingId;
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }
    }

    const transactions = await this.model.find(query)
      .populate("userId", "name email")
      .populate("companyId", "name email")
      .populate("bookingId")
      .populate("subscriptionPlanId", "name price")
      .sort({ createdAt: -1 })
      .lean();
    
    return transactions.map(t => TransactionMapper.toEntity(t));
  }

  async update(id: string, transaction: Partial<ITransaction>): Promise<ITransaction | null> {
    const updated = await this.model.findByIdAndUpdate(id, transaction, { new: true })
      .populate("userId", "name email")
      .populate("companyId", "name email")
      .lean();
    
    return updated ? TransactionMapper.toEntity(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { type: { $in: ["booking_payment", "subscription_payment"] }, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return result[0]?.total || 0;
  }

  async getTotalCommissions(): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { type: "admin_commission", status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    return result[0]?.total || 0;
  }

  async getRevenueByType(): Promise<{ type: string; total: number }[]> {
    const result = await this.model.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
      { $project: { type: "$_id", total: 1, _id: 0 } }
    ]);
    return result;
  }
}

