const mongoose = require("mongoose");
const mainConf = require("../config");
const tblConf = require("../config/tablemanage");
const Schema = mongoose.Schema;

const balanceSchema = new Schema(
  {
    userid: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: tblConf.users,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      // deposit or withdrawal
      type: String,
      required: true,
    },
    paymentMethod: {
      // system or payment gateway
      type: String,
      required: true,
    },
    payAddress: {
      // crypto pay address
      type: String,
    },
    amountType: {
      // cash or bonus
      type: String,
      required: true,
    },
    status: {
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
    newbalance: {
      type: Number,
    },
    currency: {
      type: String
    },
    comment: {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

const BetHistorySchema = new Schema(
  {
    GAMEID: {
      type: String,
      required: true,
    },
    USERID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: tblConf.users,
    },
    LAUNCHURL: {
      type: String,
      required: true,
    },
    AMOUNT: {
      type: Number,
      required: true,
    },
    betting: {
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
    result: {
      type: String,
    },
    ip: {
      type: String,
    },
  },
  { timestamps: true }
);

const BonusHistorySchema = new Schema(
  {
    GAMEID: {
      type: String,
      required: true,
    },
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

const CuracaoRakeSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  bet: {
    type: Number,
    required: true,
  },
  win: {
    type: Number,
    required: true,
  },
  rake: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  timestamp: {
    type: String,
  },
  type: {
    type: String,
  },
});

const BetConstructSchema = new Schema(
  {
    req: {
      type: Object,
      required: true,
    },
    res: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

const FreeSpinsHistory = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  gameid: {
    type: String,
    required: true,
  },
  fs_amount: {
    type: Number,
    required: true,
  },
  win_amount: {
    type: Number,
    required: true,
  },
  wager_requirement: {
    type: Number,
    required: false,
  },
  slug: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  expire_at: {
    type: Date,
    required: true,
  },
});
module.exports = {
  BalanceHistory: mongoose.model(tblConf.user_balancehistory, balanceSchema),
  BetHistory: mongoose.model(tblConf.user_bettinghistory, BetHistorySchema),
  BonusHistory: mongoose.model(tblConf.user_bonushistory, BonusHistorySchema),
  CuracaoRake: mongoose.model(tblConf.game_pokerrakes, CuracaoRakeSchema),
  BCPHistory: mongoose.model(tblConf.game_betchistory, BetConstructSchema),
  FreeSpinHistory: mongoose.model(
    tblConf.user_bonus_freespins,
    FreeSpinsHistory
  ),
};
