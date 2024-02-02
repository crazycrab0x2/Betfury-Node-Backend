const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const mailTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  tid: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
  param: {
    type: Object,
    default: {},
  },
  status: {
    type: Boolean,
    required: true,
  },
  multisend: {
    type: Boolean,
    default: false,
  },
});

const notifyTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
  param: {
    type: Object,
    default: {},
  },
  status: {
    type: Boolean,
    required: true,
  },
});

const notificationSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  method: {
    type: String,
    required: true,
  },
  receiver: {
    type: Array,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  auto: {
    type: Boolean,
    default: false,
  },
  notifyid: {
    type: String,
    default: "",
  },
});

module.exports = {
  EmailTemplateList: mongoose.model(
    tblConfig.mail_template,
    mailTemplateSchema
  ),
  NotifyTemplateList: mongoose.model(
    tblConfig.notify_template,
    notifyTemplateSchema
  ),
  NotificationList: mongoose.model(
    tblConfig.site_notification,
    notificationSchema
  ),
};
