"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareOTP = exports.hashOTP = exports.generateNumericOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const generateNumericOTP = () => {
    const buffer = crypto_1.default.randomBytes(4);
    const number = buffer.readUInt32BE(0) % 1000000;
    return number.toString().padStart(6, '0');
};
exports.generateNumericOTP = generateNumericOTP;
const hashOTP = async (otp) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(otp, salt);
};
exports.hashOTP = hashOTP;
const compareOTP = async (otp, hash) => {
    return bcryptjs_1.default.compare(otp, hash);
};
exports.compareOTP = compareOTP;
