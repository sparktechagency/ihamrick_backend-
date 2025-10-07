import mongoose, { Document, Schema } from "mongoose";

export interface IBlog extends Document {
  _id: string;
  title: string;
  status: boolean;
  description: string;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
BlogSchema.index({ title: 1 });

export const Blog = mongoose.model<IBlog>("Blog", BlogSchema);
