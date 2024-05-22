const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema({

      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gore_Data",
      },
      itemId: String,
      loginId:String,
      title: String,
      size: String,
      price: Number,
      image: String,
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    
});

const CartModel = mongoose.model("carts", cartSchema);
module.exports = CartModel;
