const mongoose = require("mongoose");
const { Schema } = mongoose;

const authScmeha = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  password: { type: String, required: true, trim: true },
  otp: Number,
  otp_expire: Date,
  resetPasswordOtp: Number,
  resetPasswordOtpExpiry: Date,
  blocked: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  avatar: {
    public_id: String,
    url: String,
  },
  bio: String,
});
const AuthModel = mongoose.model("userAuth", authScmeha);
module.exports = AuthModel;
