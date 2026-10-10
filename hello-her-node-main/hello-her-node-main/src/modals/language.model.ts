import mongoose, { Schema, Document } from "mongoose";

export interface ILanguage extends Document {
    label: string;
    value: string;
    isActive: boolean;
}

// 🔥 Normalize function
const formatString = (str: string) => {
    if (!str) return str;
    return str
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const LanguageSchema: Schema = new Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// ✅ Normalize BOTH label + value
LanguageSchema.pre<ILanguage>("save", function (this: ILanguage, next) {
    if (this.label) {
        const formatted = formatString(this.label);
        this.label = formatted;
        this.value = formatted;
    }
    next();
});

export default mongoose.model<ILanguage>("Language", LanguageSchema);