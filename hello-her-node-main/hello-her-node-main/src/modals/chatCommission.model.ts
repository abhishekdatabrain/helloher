import { Schema, model, Document } from "mongoose";

export type ChatCommissionMode = "perMinute" | "perMessage";

export interface IChatCommission extends Document {
    enabled: boolean;

    mode: ChatCommissionMode;

    perMinuteAmountPaise?: number;
    perMessageAmountPaise?: number;

    commissionPercentage: number;

    providerSharePaise: number;
    adminSharePaise: number;
    lastEnabled: boolean;
}

const chatCommissionSchema = new Schema<IChatCommission>(
    {
        enabled: {
            type: Boolean,
            default: true,
        },

        mode: {
            type: String,
            enum: ["perMinute", "perMessage"],
            required: true,
        },

        // if mode = perMinute
        perMinuteAmountPaise: {
            type: Number,
        },

        // if mode = perMessage
        perMessageAmountPaise: {
            type: Number,
        },

        commissionPercentage: {
            type: Number,
            required: true,
        },

        providerSharePaise: {
            type: Number,
            required: true,
        },

        adminSharePaise: {
            type: Number,
            required: true,
        },

        lastEnabled: {
            type: Boolean,
            default: false
        }

    },
);

export default model<IChatCommission>(
    "ChatCommission",
    chatCommissionSchema
);