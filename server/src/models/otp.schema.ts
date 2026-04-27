import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {type: String, required: true},
    otp: {type: String, required: true},
    expirationDate: {type: Date, required: true}
});

otpSchema.index({ email: 1 });
otpSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });

const OTPModel = mongoose.model('OTP', otpSchema);

export default OTPModel;