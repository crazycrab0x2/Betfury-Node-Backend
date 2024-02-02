const md5 = require("md5");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");
const mainConf = require("../config");

const AutoIncrement = require("mongoose-sequence")(mongoose);

const mainSchema = new Schema({
  id: { type: Schema.Types.ObjectId },
  firstname: { type: String, default: "" },
  lastname: { type: String, default: "" },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  create_date: { type: Date },
  avatar: { type: String, default: mainConf.USERS.baseAvatarImage },
  vipLevel: { type: String, default: mainConf.USERS.baseVipLevel },
  vipPoint: { type: Number, default: 0 },
  password: { type: String, required: true },
  balance: { type: Array, default: [{name: "USDTERC20", balance: 0, logo_url: "/images/coins/usdterc20.svg"}] },
  recentPlay: { type: Array, default: [] },
});

mainSchema.plugin(AutoIncrement, { inc_field: "userOrder" });

mainSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    this.id = this._id;
    this.password = md5(this.password);
    return next();
  } catch (err) {
    return next(err);
  }
});

mainSchema.methods.comparePassword = function (password) {
  return this.password == md5(password);
};

const sessionSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
    ref: tblConf.users,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  }
});

const verifyTempSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
    ref: tblConf.users,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    default: "",
  },
  timestamp: {
    type: String,
    required: true,
  },
});

module.exports = {
  MainUser: mongoose.model(tblConf.users, mainSchema),
  UserSession: mongoose.model(tblConf.user_session, sessionSchema),
  UserVerify: mongoose.model(tblConf.user_verify, verifyTempSchema),
};
