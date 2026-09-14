"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function generateToken(payload) {
    const secret = config_1.CONFIG.JWT_SECRET;
    const options = { expiresIn: '7d' };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function verifyToken(token) {
    const secret = config_1.CONFIG.JWT_SECRET;
    return jsonwebtoken_1.default.verify(token, secret);
}
