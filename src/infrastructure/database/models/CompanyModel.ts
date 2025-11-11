// src/infrastructure/database/models/CompanyModel.ts
import mongoose, { Schema, Document } from "mongoose";
import { ObjectId } from "mongodb";

export interface ICompany extends Document {
    _id: ObjectId; // ✅ fix
  name: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  googleId?: string | null;
role: "user" | "company" | "admin";
  status: "verified" | "pending";
  createdAt?: Date;
  updatedAt?: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: null },
    password: { type: String, default: null },
    googleId: { type: String, default: null },
    role: {
      type: String,
      enum: ["user", "company", "admin"], // ✅ Strict enum enforcement
      required: true,
    },
    status: {
      type: String,
      enum: ["verified", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;
