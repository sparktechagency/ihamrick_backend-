import mongoose, { Document, Schema } from "mongoose";

export interface ISocialLink extends Document {
  _id: string;
  name: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
SocialLinkSchema.index({ name: 1 });

export const SocialLink = mongoose.model<ISocialLink>(
  "SocialLink",
  SocialLinkSchema
);
