const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;
const AutoIncrement = require("mongoose-sequence")(mongoose);

const CurrencySchema = new Schema({
  currency: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  status: {
    type: Boolean,
    default: true,
  },
  disgame: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: "fiat",
  },
  currencyOrder: Number,
});

CurrencySchema.plugin(AutoIncrement, { inc_field: "currencyOrder" });

const PriceConfigSchema = new Schema({
  key: {
    type: String,
  },
  data: {
    type: Object,
    required: true,
  },
});

const PaymentSchema = new Schema({
  currencyData: {
    type: Array,
    required: true,
  },
  comment: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  processTime: {
    type: String,
    required: true,
  },
  country: {
    type: Array,
    default: [],
  },
  pro_info: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  detail: {
    type: Object,
    default: {},
  },
  paymentOrder: Number,
});

const permissionSchema = new Schema({
  userid: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: tblConfig.users,
  },
  gatewayData: {
    type: Object,
    default: {},
  },
});

const paymentInfoSchema = new Schema({
  userid: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: tblConfig.users,
  },
  gateway: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: tblConfig.payment_lists,
  },
  paymentData: {
    type: Object,
    default: {},
  },
});

const PraxisSchema = new Schema({
  gateway: {
    type: String,
    default: "",
  },
  method: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "",
  },
  gid: {
    type: String,
    default: "",
  },
});

module.exports = {
  CurrencyList: mongoose.model(tblConfig.currency_lists, CurrencySchema),
  PaymentList: mongoose.model(tblConfig.payment_lists, PaymentSchema),
  PaymentPermissionList: mongoose.model(
    tblConfig.payment_permissions,
    permissionSchema
  ),
  PaymentInfo: mongoose.model(tblConfig.payment_info, paymentInfoSchema),
  PriceConfig: mongoose.model(tblConfig.price_config_info, PriceConfigSchema),
  PraxisGateIds: mongoose.model(tblConfig.payment_praxis_gateids, PraxisSchema),
};
