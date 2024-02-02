const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const AgentPermissionSchema = new Schema({
  id: {
    type: Schema.Types.ObjectId,
    ref: tblConfig.users,
    require: "",
  },
  addNewAgent: {
    type: Boolean,
    default: false,
  },
  depositRequest: {
    type: Boolean,
    default: false,
  },
  withdrawRequest: {
    type: Boolean,
    default: false,
  },
  setProfileData: {
    type: Boolean,
    default: false,
  },
  setPassword: {
    type: Boolean,
    default: false,
  },
  addNewPlayer: {
    type: Boolean,
    default: false,
  },
  changeStatus: {
    type: Boolean,
    default: false,
  },
  updateProviderPermission: {
    type: Boolean,
    default: false,
  },
  updatePermission: {
    type: Boolean,
    default: false,
  },
  useBonus: {
    type: Boolean,
    default: false,
  },
});

const MainPermissionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  pid: {
    type: String,
    default: 1,
  },
});

const AgentPPSchema = new Schema({
  id: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  provider: {
    type: Object,
    default: {},
  },
});

module.exports = {
  AgentPermission: mongoose.model(
    tblConfig.user_agent_permission,
    AgentPermissionSchema
  ),
  MainPermission: mongoose.model(
    tblConfig.main_permission,
    MainPermissionSchema
  ),
  AgentProvider: mongoose.model(
    tblConfig.user_provider_permission,
    AgentPPSchema
  ),
};
