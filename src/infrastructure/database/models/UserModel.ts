import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String },
    googleId: { type: String },
    provider: { type: String, enum: ["local", "google"], default: "local" },

    // 👇 added profile-related fields
    profileImage: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
