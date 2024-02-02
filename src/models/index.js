const userModel = require("./users");
const logModel = require("./logs");
const gameModel = require("./game");
const permissionModel = require("./permission");
const balanceHistoryModel = require("./history");
const cmsModel = require("./cms");
const crmModel = require("./crm");
const vipModel = require("./vip");
const financeModel = require("./finance");
const sportsModel = require("./sports");
const tournamentsModel = require("./tournaments");
const locksModel = require("./locks");
const cashback = require("./cashback");
const exclusion = require("./exclusion");

module.exports = {
  ...userModel,
  ...logModel,
  ...gameModel,
  ...permissionModel,
  ...balanceHistoryModel,
  ...cmsModel,
  ...crmModel,
  ...vipModel,
  ...financeModel,
  ...sportsModel,
  ...tournamentsModel,
  ...locksModel,
  ...cashback,
  ...exclusion,
};
