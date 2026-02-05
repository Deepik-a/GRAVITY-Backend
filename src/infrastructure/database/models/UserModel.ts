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

    // 👇 Optional profile details
    profileImage: { type: String },
    location: { type: String },
    bio: { type: String },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
    bookingCount:{ type:Number,default:0} 
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
