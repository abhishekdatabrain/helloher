import { Schema, model, Document } from "mongoose";

export interface ILocalizedField {
  en: string;
  ar?: string;
}

export interface ISponsor extends Document {
  logo?: string;
  order: number;
  website: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: string;
  name: ILocalizedField;
  description?: ILocalizedField;
}

const localizedFieldSchema = new Schema<ILocalizedField>(
  {
    en: { type: String, required: true },
    ar: { type: String, required: false },
  },
  { _id: false }
);

const sponsorSchema = new Schema<ISponsor>(
  {
    logo: { type: String },
    order: { type: Number, default: 0 },
    website: { type: String, required: true },
    description: { type: localizedFieldSchema },
    isActive: { type: String, default: "active" },
    name: { type: localizedFieldSchema, required: true },
  },
  { timestamps: true }
);

const SponsorModel = model<ISponsor>("Sponsor", sponsorSchema);
export default SponsorModel;
