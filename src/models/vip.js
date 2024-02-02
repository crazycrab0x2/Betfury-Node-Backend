const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const vipListSchema = new Schema({
  level: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  param: {
    type: Object,
    default: {},
  },
  image: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

const bonusList = new Schema({
  bonusId: {
    type: String,
    required: true,
  },
  bonusName: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },

  banner: {
    type: Object,
    default: {},
  },
  preview: {
    type: Object,
    default: {},
  },
  home: {
    type: Object,
    default: {},
  },
  icon: {
    type: String,
    default: "",
  },

  description: {
    type: Object,
    default: {},
  },

  status: {
    type: Boolean,
    required: true,
  },
  subscribe: {
    type: Boolean,
    required: true,
  },
  homeState: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
  },
  results: {
    type: Schema.Types.Mixed,
  },
});

const landingList = new Schema({
  title: {
    type: String,
    required: true,
  },
  lid: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  image: {
    type: Object,
    default: {},
  },
  status: {
    type: Boolean,
    required: true,
  },
  order: {
    type: Number,
  },
});

const bonusArchive = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  bonusId: {
    type: String,
    required: true,
  },
  detail: {
    type: Object,
    default: {},
  },
  status: {
    // subscribed, awarded, expired, released, waiting
    type: String,
    default: "subscribed",
  },
});

const BonusTaCListSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: Object,
    default: {},
  },
  order: {
    type: Number,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

const PromoCodesSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId
  },
  promo: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'pending'
  }
}, { timestamps: true }
)


module.exports = {
  BonusList: mongoose.model(tblConfig.user_bonus_list, bonusList),
  LandingPageList: mongoose.model(
    tblConfig.user_bonus_landing_list,
    landingList
  ),
  BonusArchive: mongoose.model(tblConfig.user_bonus_archive, bonusArchive),
  VipList: mongoose.model(tblConfig.vip_list, vipListSchema),
  BonusTaCList: mongoose.model(tblConfig.vip_tac_lists, BonusTaCListSchema),
  PromoCodes: mongoose.model(tblConfig.user_promo_code, PromoCodesSchema),
};
