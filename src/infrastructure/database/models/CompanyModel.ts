// src/infrastructure/database/models/CompanyModel.ts
import mongoose, { Schema, Document } from "mongoose";
import { ObjectId } from "mongodb";

export interface ICompany extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  googleId?: string | null;
  role: "user" | "company";
  status: "verified" | "pending";
  isBlocked: boolean;

  // documents as plain strings
  documents: {
    GST_Certificate?: string | null;
    RERA_License?: string | null;
    Trade_License?: string | null;
  };

  documentStatus: "pending" | "verified" | "rejected";
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
      enum: ["user", "company"],
      required: true,
    },

    status: {
      type: String,
      enum: ["verified", "pending"],
      default: "pending",
    },

    isBlocked: { 
      type: Boolean, 
      default: false 
    },

    // documents as plain strings
    documents: {
      GST_Certificate: { type: String, default: null },
      RERA_License: { type: String, default: null },
      Trade_License: { type: String, default: null },
    },

    documentStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;
