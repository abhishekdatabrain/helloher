import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId; 
  quantity: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId; 
  items: ICartItem[];
  totalAmount: number; 
  finalAmount: number; 
  metaDetail: Record<string, any>; 
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
    },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
    metaDetail: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Optional: auto-calculate amounts before save
cartSchema.pre("save", async function (next) {
  let total = 0;

  // populate product price dynamically
  for (const item of this.items) {
    const product: any = await mongoose
      .model("Product")
      .findById(item.product)
      .select("price");
    if (product) {
      total += product.price * item.quantity;
    }
  }

  this.totalAmount = total;
  this.finalAmount = total; 

  next();
});

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
