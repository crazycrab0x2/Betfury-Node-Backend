const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

const tournamentSchema = new Schema({
  ID: {
    type: Number,
  },
  Leaderboard: [
    {
      type: Schema.Types.Mixed,
    },
  ],
  Series: {
    type: String,
  },
  Name: {
    type: Schema.Types.Mixed,
  },
  Description: {
    type: Schema.Types.Mixed,
  },
  Selected: {
    type: Number,
  },
  Qualified: {
    type: Number,
  },
  WinnerBy: {
    type: String,
  },
  PointsTotal: {
    type: String,
  },
  PointsLimit: {
    type: Number,
  },
  PointsLimitMin: {
    type: Number,
  },
  FeeType: {
    type: String,
  },
  FeeAmount: {
    EUR: {
      type: Date,
    },
    Currency: {
      type: Number,
    },
  },
  Qualification: {
    type: String,
  },
  BetMin: {
    type: Schema.Types.Mixed,
  },
  BetMax: {
    type: Schema.Types.Mixed,
  },
  Repeat: {
    type: String,
  },
  Target: {
    type: String,
  },
  Type: {
    type: String,
  },
  Value: {
    type: String,
  },
  Starts: {
    type: Date,
  },
  Ends: {
    type: Date,
  },
  Status: {
    type: Date,
  },
  Weight: {
    type: String,
  },
  Games: {
    Games: {
      type: Array,
    },
    Categories: {
      type: [Number],
    },
    Merchants: {
      type: [Number],
    },
    GamesBL: {
      type: Array,
    },
    CategoriesBL: {
      type: Array,
    },
    MerchantsBL: {
      type: Array,
    },
  },
  FreeroundGames: {
    type: String,
  },
  WinToBetRatio: {
    type: String,
  },
  WinningBonusesID: {
    type: Schema.Types.Mixed,
  },
  RemainingTime: {
    type: Number,
  },
  CurrentTime: {
    type: Number,
  },
  TotalFounds: {
    EUR: {
      type: Schema.Types.Mixed,
    },
    Currency: {
      type: Schema.Types.Mixed,
    },
  },
  TournamentStatus: {
    type: String,
    default: "",
  },
  WinningSpread: {
    Percent: {
      type: [String],
    },
    EUR: {
      type: [Number],
    },
    Currency: {
      type: [Schema.Types.Mixed],
    },
  },
  Terms: {
    en: {
      type: String,
    },
  },
  Image: {
    en: {
      type: String,
      default: "",
    },
    it: {
      type: String,
      default: "",
    },
  },
  Image_promo: {
    en: {
      type: String,
    },
  },
});

tournamentSchema.pre("save", function (next) {
  const currentDate = new Date().toISOString();

  if (this.Starts < currentDate && this.Ends > currentDate) {
    this.TournamentStatus = "active";
  } else if (this.Ends < currentDate) {
    this.TournamentStatus = "past";
  } else if (this.Starts > currentDate) {
    this.TournamentStatus = "future";
  }

  next();
});

module.exports = {
  Tournaments: mongoose.model(tblConf.tournaments, tournamentSchema),
};
