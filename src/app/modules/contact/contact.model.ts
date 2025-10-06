import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ContactAttrs {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  meta?: {
    ip?: string;
    userAgent?: string;
    referer?: string;
  };
}

export interface ContactDoc extends Document, ContactAttrs {
  createdAt: Date;
}

const ContactSchema = new Schema<ContactDoc>(
  {
    firstName: { type: String, required: true, maxlength: 50 },
    lastName: { type: String, required: true, maxlength: 50 },
    email: { type: String, required: true, lowercase: true, index: true },
    phone: { type: String, required: true },
    message: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const Contact: Model<ContactDoc> =
  (mongoose.models.Contact as Model<ContactDoc>) ||
  mongoose.model<ContactDoc>("Contact", ContactSchema);

export default Contact;
