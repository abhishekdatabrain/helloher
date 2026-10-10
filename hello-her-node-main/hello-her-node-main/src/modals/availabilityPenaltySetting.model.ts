import mongoose, { Document, Schema } from "mongoose";

export interface IAvailabilityPenaltySetting extends Document {
    key: string; // e.g. 'availability_penalty'
    enabled: boolean;
    minCallsPerDay: number;
    minOnlineHoursPerDay: number; // hours
    penaltyAmountRs: number;
    meta?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

const availabilityPenaltySchema = new Schema<IAvailabilityPenaltySetting>(
    {
        key: { type: String, required: true, unique: true },
        enabled: { type: Boolean, default: true },
        minCallsPerDay: { type: Number, default: 5 },
        minOnlineHoursPerDay: { type: Number, default: 3 },
        penaltyAmountRs: { type: Number, default: 10 },
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export const AvailabilityPenaltySetting = mongoose.models.AvailabilityPenaltySetting || mongoose.model<IAvailabilityPenaltySetting>("AvailabilityPenaltySetting", availabilityPenaltySchema);

export default AvailabilityPenaltySetting;
