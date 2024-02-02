const mongoose = require("mongoose");
const tblConf = require("../config/tablemanage");
const Schema = mongoose.Schema;

const SportsBetHistorySchema = new Schema(
  {
    USERID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: tblConf.users,
    },
    LAUNCHURL: {
      type: Number,
      required: true,
    },
    AMOUNT: {
      type: Number,
      required: true,
    },
    betting: {
      type: Object,
      required: true,
    },
    detail: {
      type: Object,
      default: {},
    },
    TYPE: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    lastbalance: {
      type: Number,
      required: true,
    },
    updatedbalance: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    ip: {
      type: String,
    },
  },
  { timestamps: true }
);

const SportsBetHistoryApiInfo = new Schema({
  fromDate: {
    type: Date,
    required: true,
  },
  toDate: {
    type: Date,
    required: true,
  },
  state: {
    type: Boolean,
    default: true,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
});

const SportsListSchema = new Schema({
  SportId: {
    type: Number,
    required: true,
  },
  SportName: {
    type: String,
    required: true,
  },
});

const SportsRegionSchema = new Schema({
  RegionId: {
    type: Number,
    required: true,
  },
  RegionName: {
    type: String,
    required: true,
  },
});

const SportsCompeSchema = new Schema({
  CompetitionId: {
    type: Number,
    required: true,
  },
  CompetitionName: {
    type: String,
    required: true,
  },
});

const SportsMatchSchema = new Schema({
  MatchId: {
    type: Number,
    required: true,
  },
  Status: {
    type: String,
    required: true,
  },
  StartTime: {
    type: Date,
    required: true,
  },
  HomeTeam: {
    type: String,
    default: "",
  },
  AwayTeam: {
    type: String,
    default: "",
  },
});

module.exports = {
  SportsBetHistory: mongoose.model(
    tblConf.user_sport_bettinghistory,
    SportsBetHistorySchema
  ),
  SportsBHApi: mongoose.model(
    tblConf.user_sport_bh_api,
    SportsBetHistoryApiInfo
  ),
  SportsList: mongoose.model(tblConf.user_sport_list, SportsListSchema),
  SportsRegion: mongoose.model(tblConf.user_sport_region, SportsRegionSchema),
  SportsCompetition: mongoose.model(
    tblConf.user_sport_compe,
    SportsCompeSchema
  ),
  SportsMatch: mongoose.model(tblConf.user_sport_match, SportsMatchSchema),
};
