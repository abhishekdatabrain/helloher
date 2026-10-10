import mongoose, { Document, Schema } from "mongoose";

export interface IConversation extends Document {
    participants: string[];
    lastMessage?: string;
    lastMessageAt?: Date;
    lastMessageSender?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        participants: [{ 
            type: Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        }],
        lastMessage: { type: String },
        lastMessageAt: { type: Date },
        lastMessageSender: { 
            type: Schema.Types.ObjectId, 
            ref: "User" 
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
    },
    { timestamps: true }
);

// Add indexes for better performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isActive: 1 });

// Ensure participants array unique & capped to 2 (for 1:1 chat)
conversationSchema.pre("save", function(next) {
    this.participants = Array.from(new Set(this.participants.map(p => p.toString())));
    next();
});

export const Conversation = mongoose.model<IConversation>(
    "Conversation",
    conversationSchema
);
