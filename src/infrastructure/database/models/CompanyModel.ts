import mongoose, { Schema, Document } from "mongoose";
import { ObjectId } from "mongodb";
import { ICompanyProfile } from "@/domain/entities/Company";

export interface ICompany extends Omit<Document, "_id"> {
  _id: ObjectId;
  name: string;
  email: string;
  phone?: string | null;
  password?: string | null;
  googleId?: string | null;

  role: "user" | "company";
  provider: "local" | "google";
  status: "verified" | "pending";
  isBlocked: boolean;
  isProfileFilled: boolean;
  isSubscribed: boolean;
  walletBalance: number;
  profileImage?: string | null;
  companyLocation?: string | null;
  bio?: string | null;

  documents: {
    GST_Certificate?: string | null;
    RERA_License?: string | null;
    Trade_License?: string | null;
  };

  documentStatus: "pending" | "verified" | "rejected";
  rejectionReason?: string | null;
  subscription?: {
    planId?: ObjectId | null;
    status: "active" | "expired" | "cancelled" | "none";
    startDate?: Date | null;
    endDate?: Date | null;
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
  };
  profile?: ICompanyProfile | null;
  createdAt: Date;
  updatedAt: Date;
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
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    profileImage: { type: String, default: null },
    companyLocation: { type: String, default: null },
    bio: { type: String, default: null },

    status: {
      type: String,
      enum: ["verified", "pending"],
      default: "pending",
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isProfileFilled: {
      type: Boolean,
      default: false,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    walletBalance: {
      type: Number,
      default: 0,
    },

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

    rejectionReason: {
      type: String,
      default: null,
    },
    subscription: {
      planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", default: null },
      status: { 
        type: String, 
        enum: ["active", "expired", "cancelled", "none"], 
        default: "none" 
      },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      stripeSubscriptionId: { type: String, default: null },
      stripeCustomerId: { type: String, default: null },
    },
    profile: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;
