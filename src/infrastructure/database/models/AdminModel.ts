import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAdmin extends Document {
    _id:Types.ObjectId
    email:string;
    password:string;
    role:"admin";
    refreshToken:string
} 

const adminSchema = new Schema<IAdmin>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
    role: { type: String, default: "admin" },

  refreshToken: {
    type: String,
  },
}, { timestamps: true });


//forces the db to use "admin" collection ,if i use 3 arguments like "Admin","adminSchema","admin" 
const AdminModel = mongoose.model<IAdmin>("Admin", adminSchema, "admin");

export default AdminModel;


