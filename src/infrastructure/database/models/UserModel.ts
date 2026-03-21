import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String },
    googleId: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    role: { type: String },
    status: {
      type: String,
    },
       isBlocked: { 
      type: Boolean, 
      default: false 
    },
    isProfileFilled: {
      type: Boolean,
      default: false
    },
    isSubscribed: {
      type: Boolean,
      default: false
    },

    // 👇 Optional profile details
    profileImage: { type: String },
    location: { type: String },
    bio: { type: String },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
    bookingCount:{ type:Number,default:0} 
  },
  { timestamps: true }
);

export interface IUserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  googleId?: string;
  provider: "local" | "google";
  role?: string;
  status?: string;
  documentStatus?: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  isBlocked: boolean;
  isProfileFilled: boolean;
  isSubscribed: boolean;
  profileImage?: string;
  location?: string;
  bio?: string;
  favourites: mongoose.Types.ObjectId[];
  bookingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserModel = mongoose.model<IUserDocument>("User", userSchema);
export default UserModel;
