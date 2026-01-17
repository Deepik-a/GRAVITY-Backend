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
  provider: "local" | "google";
  status: "verified" | "pending";
  isBlocked: boolean;
  isProfileFilled: boolean;
  isSubscribed: boolean;
  walletBalance: number;
  profileImage?: string | null;
  location?: string | null;
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
  profile?: {
    companyName?: string;
    categories: string[];
    services: string[];
    consultationFee: number;
    establishedYear: number;
    companySize: string;
    overview: string;
    projectsCompleted: number;
    happyCustomers: number;
    awardsWon: number;
    awardsRecognition: string;
    contactOptions: {
      chatSupport: boolean;
      videoCalls: boolean;
    };
    teamMembers: {
      id: number;
      name: string;
      qualification: string;
      role: string;
      photo?: string;
    }[];
    projects: {
      id: number;
      title: string;
      description: string;
      beforeImage?: string;
      afterImage?: string;
      date?: string;
    }[];
    brandIdentity: {
      logo?: string;
      banner1?: string;
      banner2?: string;
      profilePicture?: string;
    };
  } | null;
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
    location: { type: String, default: null },
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
      type: {
        companyName: { type: String, default: "" },
        categories: [{ type: String }],
        services: [{ type: String }],
        consultationFee: { type: Number, default: 0 },
        establishedYear: { type: Number, default: 2024 },
        companySize: { type: String, default: "1-10 employees" },
        overview: { type: String, default: "" },
        projectsCompleted: { type: Number, default: 0 },
        happyCustomers: { type: Number, default: 0 },
        awardsWon: { type: Number, default: 0 },
        awardsRecognition: { type: String, default: "" },
        contactOptions: {
          chatSupport: { type: Boolean, default: true },
          videoCalls: { type: Boolean, default: false },
        },
        teamMembers: [{
          id: { type: Number },
          name: { type: String },
          qualification: { type: String },
          role: { type: String },
          photo: { type: String },
        }],
        projects: [{
          id: { type: Number },
          title: { type: String },
          description: { type: String },
          beforeImage: { type: String },
          afterImage: { type: String },
          date: { type: String },
        }],
        brandIdentity: {
          logo: { type: String },
          banner1: { type: String },
          banner2: { type: String },
          profilePicture: { type: String },
        }
      },
      default: null
    }
  },
  { timestamps: true }
);


const CompanyModel = mongoose.model<ICompany>("Company", CompanySchema);
export default CompanyModel;
