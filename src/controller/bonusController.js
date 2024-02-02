const mongoose = require("mongoose");

const baseController = require("./baseController");

const {
  MainUser,
  BonusArchive,
  FsGameLists,
  FreeSpinHistory,
  PromoCodes,
} = require("../models");

const mainConfig = require("../config");
const ProConf = require("../config/provider");
const tblConfig = require("../config/tablemanage");
const servConf = require("../../serverConf");
const serverConf = require("../../serverConf");

exports.bonusHandle = async (user, currency, amount, req) => {
  const update = {
    [`balance.${currency}`]: (
      Math.round(
        (parseFloat(user.balance[currency]) + parseFloat(amount)) * 100
      ) / 100.0
    ),
    "freespin.lastDeposit": Date.now(),
  };
  //Function for adding Freespin to user

  const autoAddFs = async (updateUser) => {
    // For iterate Freespin games lists every day.
    const userUpdate = await MainUser.findOne({ _id: updateUser._id });
    const fsGameData = await FsGameLists.findOne({
      no: userUpdate.freespin.flag % 3,
    });
    if (userUpdate.freespin.amount <= 0) {
      return;
    } else {
      console.log("ffffxiesl------>", fsGameData);
      const existOne = await FreeSpinHistory.findOne({
        userId: user._id,
        gameid: fsGameData.game_id,
        status: "active",
      });
      if (existOne) {
        existOne.fs_amount += 50;
        await existOne.save();
        await baseController.axiosRequest(
          serverConf.gameAPI.Ryan.hostURL,
          {
            api_login: serverConf.gameAPI.Ryan.api_login,
            api_password: serverConf.gameAPI.Ryan.api_password,
            method: "addFreeRounds",
            gameid: fsGameData.game_id,
            freespins:
              userUpdate.freespin.amount >= 50
                ? 50
                : userUpdate.freespin.amount,
            bet_level: 0,
            valid_days: 3,
            user_username: user.username,
            user_password: user.password,
            currency: user.dis_currency,
          },
          "POST"
        );
        await MainUser.findOneAndUpdate(
          { _id: user._id },
          {
            $inc: {
              "freespin.flag": 1,
              "freespin.amount":
                updateUser.freespin.amount >= 50
                  ? -50
                  : -updateUser.freespin.amount,
            },
          },
          { new: true, upsert: true }
        );
      } else {
        newFsHistory = {
          userId: user._id,
          gameid: fsGameData.game_id,
          fs_amount: 50,
          win_amount: 0,
          slug: fsGameData.slug,
          status: "active",
          expire_at: Date.now() + 7 * 24 * 3600 * 1000, // will be expired after 7 days.
        };
        await FreeSpinHistory(newFsHistory).save();
        const addFreeSpins = await baseController.axiosRequest(
          serverConf.gameAPI.Ryan.hostURL,
          {
            api_login: serverConf.gameAPI.Ryan.api_login,
            api_password: serverConf.gameAPI.Ryan.api_password,
            method: "addFreeRounds",
            gameid: fsGameData.game_id,
            freespins:
              updateUser.freespin.amount >= 50
                ? 50
                : updateUser.freespin.amount,
            bet_level: 0,
            valid_days: 3,
            user_username: user.username,
            user_password: user.password,
            currency: user.dis_currency,
          },
          "POST"
        );
        await MainUser.findOneAndUpdate(
          { _id: user._id },
          {
            $inc: {
              "freespin.flag": 1,
              "freespin.amount":
                updateUser.freespin.amount >= 50
                  ? -50
                  : -updateUser.freespin.amount,
            },
          },
          { new: true, upsert: true }
        );
      }
    }
  };
  //User should make some deposit within 10mins to redeem the welcome bonus
  if (user.deposited == 0 && Date.now() - user.create_date.valueOf() < 600000) {
    const updateUserWelcome = await MainUser.findOneAndUpdate(
      { _id: user._id },
      {
        [`balance.${currency}`]: (
          Math.round(
            (parseFloat(user.balance[currency]) + parseFloat(amount)) * 100
          ) / 100.0
        ),
        "freespin.lastDeposit": Date.now(),
        "freespin.amount": 200,
        "freespin.addAt": Date.now(),
        $inc: {
          bonus_balance: (Math.round(parseFloat(amount) * 100) / 100.0) * 2,
        },
      }
    );
    const newBonus = {
      userId: mongoose.Types.ObjectId(user._id),
      bonusId: "72580",
      status: "active",
      detail: {
        title: "WELCOMEDEP",
        Wagering: (
          Math.round((parseFloat(amount) + parseFloat(amount) * 2) * 35 * 100) /
          100.0
        ),
        WageringTotal: 0,
        amount:
          (Math.round(parseFloat(amount) * 2 * 100) / 100.0) > 6000
            ? 6000
            : Math.round(parseFloat(amount) * 2 * 100) / 100.0,
        expiredAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
      },
    };
    await BonusArchive(newBonus).save();
    await autoAddFs(updateUserWelcome);
    const intervalID_welcome = setInterval(async () => {
      console.log("setInterval======welcome==========>");
      if (updateUser.freespin.amount <= 0) {
        clearInterval(intervalID_welcome);
      }
      await autoAddFs(updateUserWelcome);
    }, 24 * 3600 * 1000);
  } else {
    const is_bonus = await BonusArchive.findOne({
      userId: user._id,
      status: "active",
    });
    console.log(is_bonus, "is_bonus======>");
    if (is_bonus) {
      is_bonus.status = "cancelled";
      await is_bonus.save();
    }
    const io = req.app.get("socketio");
    switch (user.promo_code) {
      case "FIRSTDEP":
        const updateUserFirst = await MainUser.findOneAndUpdate(
          { _id: user._id },
          {
            $set: update,
            bonus_balance: (Math.round(parseFloat(amount) * 100) / 100.0) * 2, //deposit bonus 200%
            "freespin.amount": 100,
            "freespin.flag": 1,
            "freespin.addAt": Date.now(),
            $inc: { deposited: 1 },
          },
          { new: true, upsert: true }
        );
        io.sockets.emit("updateBalance", { balance: updateUserFirst.balance, id: user.id })
        await this.createBonus(user._id, user.promo_code, amount, 200);
        await autoAddFs(updateUserFirst);
        const intervalID = setInterval(async () => {
          console.log("setInterval======FirstDEP=======>");
          const userUpdate = await MainUser.findOne({ _id: user._id });
          if (userUpdate.freespin.amount <= 0) {
            clearInterval(intervalID);
            return;
          }
          await autoAddFs(userUpdate);
        }, 24 * 3600 * 1000);
        break;
      case "SECONDDEP":
        const updateUserSecond = await MainUser.findOneAndUpdate(
          { _id: user._id },
          {
            $set: update,
            bonus_balance: Math.round(parseFloat(amount) * 100) / 100.0, //deposit bonus 100%
            "freespin.amount": 0,
            "freespin.addAt": Date.now(),
            $inc: { deposited: 1 },
          },
          { new: true, upsert: true }
        );
        io.sockets.emit("updateBalance", { balance: updateUserSecond.balance, id: user.id })
        this.createBonus(user._id, user.promo_code, amount, 100);
        break;
      case "THIRDDEP":
        const updateUserthird = await MainUser.findOneAndUpdate(
          { _id: user._id },
          {
            $set: update,
            bonus_balance: Math.round(parseFloat(amount) * 100) / 100.0, //deposit bonus 100%
            "freespin.amount": 100,
            "freespin.addAt": Date.now(),
            $inc: { deposited: 1 },
          },
          { new: true, upsert: true }
        );
        await autoAddFs(updateUserthird);
        const intervalID_third = setInterval(async () => {
          console.log("setInterval======ThirdDEP===========>");
          io.sockets.emit("updateBalance", { balance: updateUserthird.balance, id: user.id })
          if (updateUserthird.freespin.amount <= 0) {
            clearInterval(intervalID_third);
          }
          await autoAddFs(updateUserthird);
        }, 10 * 1000);
        this.createBonus(user._id, user.promo_code, amount, 100);
        break;
      default:
        const updateUser = await MainUser.findOneAndUpdate(
          { _id: user._id },
          {
            $set: update,
            $inc: { deposited: 1 },
          },
          { new: true, upsert: true }
        );
        console.log(updateUser.username, "depositUpdate===>")
        io.sockets.emit("updateBalance", {balance: updateUser, id: user.id})  
    }
  }
};

exports.hasReachedMaxUsage = async (user) => {
  if (user.deposited >= 4) {
    return true;
  }
};

exports.createBonus = async (userId, promo_code, price_amount, percentage) => {
  const newBonus = {
    userId: mongoose.Types.ObjectId(userId),
    bonusId: "72580",
    status: "active",
    detail: {
      title: promo_code,
      Wagering: (
        (Number(price_amount) + (Number(price_amount) * percentage) / 100) *
        35
      ).toFixed(2),
      WageringTotal: 0,
      amount:
        (Number(price_amount) * percentage) / 100 > 2000
          ? 2000
          : ((Number(price_amount) * percentage) / 100).toFixed(2),
      expiredAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
    },
  };
  await BonusArchive(newBonus).save();
};

exports.getBonusHistory = async (req, res) => {
  const user = req.user;
  const bonusHistory = await BonusArchive.find({ userId: user._id });
  if (bonusHistory) {
    res.status(200).json({ msg: "success", data: bonusHistory });
  } else {
    res.status(400).send("no data");
  }
};

exports.userBonusCheck = async (req, res) => {
  const { user } = req
  const promocode = req.body.promocode
  const promoLists = await PromoCodes.find({ userId: user._id })

  console.log(promoLists, "promoLists==>")
  let activePromo = false
  if (promoLists.length > 0) {
    promoLists.map(async (promo) => {
      if (promo.status == "active") {
        activePromo = true
        res.status(400).json({ msg: "has active promo", promo_name: promo.promo })
      }
    })
    if (!activePromo) {
      const currentPromo = await PromoCodes.findOne({ userId: user._id, promo: promocode })
      if (currentPromo) {
        if (currentPromo.status == "awarded") {
          res.status(400).json({ msg: "awarded", updatedAt: currentPromo.updatedAt })
        } else if (currentPromo.status == "cancelled") {
          res.status(400).json({ mag: "cancelled", updatedAt: currentPromo.updatedAt })
        } else {
          currentPromo.status = "cancelled"
          await currentPromo.save()
        }
      } else {
        const newPromo = {
          userId: user._id,
          promo: promocode,
          status: "pending",
        }
        await PromoCodes(newPromo).save()
        res.status(200).json({ msg: "successful promo registry!" })
      }
    }
  } else {
  }

  // else if (promo.promo == promocode && promo.status == "awarded") {
  //   res.status(400).json({ msg: "awarded" })
  //   return
  // } else if (promo.promo == promocode && promo.status == "cancelled") {
  //   res.status(400).json({ msg: "cancelled" })
  //   return
  // } else if (promo.promo == promocode && promo.status == "pending") {

  // }

  // const get_bonus_data = await BonusArchive.findOne(
  //   {
  //     userId: user._id,
  //     status: "active",
  //   }
  // );
  // if (!get_bonus_data) {
  //   await MainUser.findOneAndUpdate(
  //     { _id: user._id },
  //     { $set: { promo_code: promocode?.toUpperCase() } },
  //     { upsert: true },
  //   );
  //   res.send("no bonus");
  // } else {
  //   res.send("has active bonus");
  // }
};
