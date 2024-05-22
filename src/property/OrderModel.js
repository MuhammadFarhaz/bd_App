// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {
//     products: [
//       {
//         type: mongoose.ObjectId,
//         ref: "Cart",
//       },
//     ],
//     payment: {},

//     status: {
//       type: String,
//       default: "Not Process",
//       enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Order", orderSchema);

const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    orderItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrderItem',
      required:true
  }],
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gore_Data',
  },

    customerName: String,
    email: String,
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "deliverd", "cancel"],
    },
  }

);

const OrderModel = mongoose.model("Order", orderSchema);
module.exports = OrderModel;
