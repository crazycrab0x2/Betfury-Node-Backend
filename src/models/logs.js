const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const loginHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: tblConfig.users,
      required: true,
    },
    ip: {
      type: String,
    },
    country: {
      type: String,
    },
    browser: {
      type: String,
    },
    version: {
      type: String,
    },
    os: {
      type: String,
    },
    platform: {
      type: String,
    },
    action: {
      type: String,
    },
    comment: {
      type: String,
    },
    clickid: {
      type: String,
    },
  },
  { timestamps: true }
);

const loginAttemptHistorySchema = new Schema(
  {
    ip: {
      type: String,
    },
    action: {
      type: String,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

const blockIpSchema = new Schema(
  {
    ip: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const ipapiSchema = new Schema(
  {
    ip: {
      type: String,
    },
    site: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = {
  LogHistory: mongoose.model(tblConfig.user_log, loginHistorySchema),
  LogAttemptHistory: mongoose.model(
    tblConfig.user_attempts_log,
    loginAttemptHistorySchema
  ),
  BlockIPs: mongoose.model(tblConfig.site_blockip, blockIpSchema),
  IpAPIHistory: mongoose.model(tblConfig.ipapihistory, ipapiSchema),
};
