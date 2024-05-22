const mongoose = require("mongoose");
const { Schema } = mongoose;

const propertySchema = new Schema({
  title: String,
  category: String,
  size: String,
  description: String,
  price: Number,
  prevPrice: Number,
  deal:Number,
  image: String,
  costPrice: Number,
  stock: {
    type: Number,
    default: 0,
  },
});
const PropertyMode = mongoose.model("Gore_Data", propertySchema);
module.exports = PropertyMode;
