const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const gameTypesSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
  },
});

const GameProvidersSchema = new Schema({
  providerName: {
    type: String,
    required: true,
  },
  Agregator: {
    type: String,
    required: true,
  },
  Percentage: {
    type: Number,
    default: 0,
  },
  RTP: {
    type: Number,
    default: 95,
  },
  gameType: {
    type: String,
  },
  providerOrder: {
    type: Number,
  },
  status: {
    type: Boolean,
    default: true,
  },
  Route: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    default: "",
  },
  pro_info: {
    type: String,
    default: "",
  },
  currency: {
    type: Array,
    default: [],
  },
  country: {
    type: Array,
    default: [],
  },
});

const FsGameLists = new Schema({
  no: {
    type: Number,
    required: true,
  },
  game_id: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
  },
});

const GameListSchema = new Schema({
  gameId: {
    type: String,
    required: true,
  },
  gameName: {
    type: String,
    required: true,
  },
  launchUrlId: {
    type: Number,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  gameType: {
    type: String,
  },
  percentage: {
    type: Number,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isDesktop: {
    type: Boolean,
    default: true,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  opens: {
    type: Number,
    default: 0,
  },
  provider: {
    type: String,
  },
  funmode: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    required: true,
  },
  // featuredImageUrl: {
  // 	type: String,
  // 	default: ""
  // },
  // isonline: {
  // 	type: Boolean,
  // 	default: true
  // },
  // status: {
  // 	type: Boolean,
  // 	default: true
  // },
  // detail: {
  // 	type: Object,
  // 	default: {}
  // },
  // currencys: {
  // 	type: Array,
  // 	default: ["EUR"]
  // },
  // ip: {
  // 	type: String,
  // },
});

module.exports = {
  GameTypes: mongoose.model(tblConfig.game_types, gameTypesSchema),
  GameProviders: mongoose.model(tblConfig.game_providers, GameProvidersSchema),
  GameLists: mongoose.model(tblConfig.game_lists, GameListSchema),
  FsGameLists: mongoose.model(tblConfig.fs_games_lists, FsGameLists),
};
