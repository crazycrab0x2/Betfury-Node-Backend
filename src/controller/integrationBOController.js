const requestIp = require("request-ip");
const referralCodes = require("referral-codes");

const baseController = require("./baseController");
const configController = require("./configController");
const redis = require("redis");
const client = redis.createClient();
const client_credit = redis.createClient();

const {
  MainUser,
  UserSession,
  BetHistory,
  GameLists,
  BonusArchive,
  FreeSpinHistory,
} = require("../models");

const mainConfig = require("../config");
const serverConf = require("../../serverConf");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");

const ObjectId = require("mongoose").Types.ObjectId;
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const sem = require("semaphore")(1);

exports.endpoint = async (req, res) => {
  sem.take(async function () {
    if (req.query.action == "balance") {
      const { callerPrefix, remote_id, username, session_id, currency } =
        req.query;
      console.log("balance", req.query);
      let queryList = [];
      Object.keys(req.query).map((key) => {
        if (key != "key") queryList.push(`${key}=${req.query[key]}`);
      });
      const queryString = queryList.join("&");
      if (
        req.query.key !=
        CryptoJS.SHA1(
          serverConf.gameAPI.BlueOcean.saltKey + queryString
        ).toString()
      ) {
        sem.leave();
        return res
          .status(200)
          .json({ status: "403", msg: "INCORRECT_KEY_VALIDATION" });
      } else {
        const session = await UserSession.findOne({
          "gameProfile.id": remote_id,
        });
        if (session == null) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "remote_id doesn't match" });
        } else if (session.gameProfile.username != callerPrefix + username) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else if (session.gameProfile.sessionid != session_id) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else {
          const user = await MainUser.findOne({ _id: session.id });
          if (user == null) {
            sem.leave();
            return res
              .status(200)
              .json({ status: "500", msg: "user can't find" });
          }
          else {
            sem.leave();
            return res
              .status(200)
              .json({ status: "200", balance: user.balance[currency] });
          }
        }
      }
    } else if (req.query.action == "debit") {
      const {
        callerPrefix,
        remote_id,
        username,
        session_id,
        currency,
        amount,
        game_id,
        transaction_id,
      } = req.query;
      console.log("debit---", req.query);
      const session = await UserSession.findOne({
        "gameProfile.id": remote_id,
      });
      const user = await MainUser.findOne({ _id: session.id });

      let queryList = [];
      Object.keys(req.query).map((key) => {
        if (key != "key") queryList.push(`${key}=${req.query[key]}`);
      });
      const queryString = queryList.join("&");
      if (
        req.query.key !=
        CryptoJS.SHA1(
          serverConf.gameAPI.BlueOcean.saltKey + queryString
        ).toString()
      ) {
        sem.leave();
        return res
          .status(200)
          .json({ status: "403", msg: "INCORRECT_KEY_VALIDATION" });
      } else {

        if (session == null) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "remote_id doesn't match" });
        } else if (session.gameProfile.username != callerPrefix + username) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else if (session.gameProfile.sessionid != session_id) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else if (parseFloat(amount) < 0) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "403", msg: "Amount is negative" });
        } else {
          if (user == null) {
            sem.leave();
            return res
              .status(200)
              .json({ status: "500", msg: "user can't find" });
          }
          else if (parseFloat(user.balance[currency]) < parseFloat(amount)) {
            sem.leave();
            return res
              .status(200)
              .json({ status: "403", msg: "Insufficient funds" });
          } else {
            try {
              const transaction = await BetHistory.findOne(
                {
                  transactionId: transaction_id,
                  USERID: user._id
                }
              );
              if (transaction == null) {
                const update = {
                  $inc: {
                    [`balance.${currency}`]: -1 * Math.round(parseFloat(amount) * 100) / 100.0,
                  },
                };
                const newUser = await MainUser.findOneAndUpdate(
                  { _id: user._id },
                  update,
                  { new: true, upsert: true }
                );
                const newTransaction = {
                  GAMEID: game_id,
                  USERID: user._id,
                  LAUNCHURL: "BlueOcean",
                  AMOUNT: amount,
                  TYPE: "BET",
                  transactionId: transaction_id,
                  lastbalance: user.balance[currency],
                  updatedbalance: (
                    Math.round(
                      (parseFloat(user.balance[currency]) - parseFloat(amount)) *
                      100
                    ) / 100.0
                  ),
                  currency: currency,
                  result: "OK",
                };
                await BetHistory(newTransaction).save();
                const game = await GameLists.findOne({ gameId: game_id });
                const get_user_bonus = await BonusArchive.findOne({
                  userId: user._id,
                  status: "active",
                });
                if (get_user_bonus) {
                  if (
                    Number(get_user_bonus.detail.WageringTotal) +
                    (amount * game.percentage) / 100 >=
                    Number(get_user_bonus.detail.Wagering)
                  ) {
                    get_user_bonus.status = "completed";
                    get_user_bonus.detail = {
                      ...get_user_bonus.detail,
                      WageringTotal: get_user_bonus.detail.Wagering,
                    };
                    await get_user_bonus.save();

                    //convert the bonus amount to user's real balance
                    newUser.balance = {
                      ...newUser.balance,
                      [currency]: (
                        Math.round(parseFloat(newUser.balance[currency]) * 100) /
                        100.0 +
                        parseFloat(get_user_bonus.detail.amount)
                      ),
                    };
                    if (
                      newUser.bonus_balance > 0 &&
                      newUser.bonus_balance >= get_user_bonus.detail.amount
                    ) {
                      newUser.bonus_balance =
                        Math.round(
                          (newUser.bonus_balance - get_user_bonus.detail.amount) *
                          100
                        ) / 100;
                      await newUser.save();
                    }
                  }

                  //add the wageringTotal value
                  else {
                    await BonusArchive.findOneAndUpdate(
                      { userId: user._id, status: "active" },
                      {
                        $inc: {
                          "detail.WageringTotal": (amount * game.percentage) / 100,
                        },
                      },
                      { new: true, upsert: true }
                    );
                  }
                }
                sem.leave();
                return res
                  .status(200)
                  .json({ status: "200", balance: newUser.balance[currency] });

              }
              else if (transaction.LAUNCHURL != "BlueOcean") {
                return res
                  .status(200)
                  .json({ status: "500", msg: "Transaction not found" });
              } else {
                if (
                  transaction.USERID.toString() == user._id.toString() &&
                  transaction.TYPE == "BET" &&
                  transaction.GAMEID == game_id &&
                  transaction.currency == currency &&
                  transaction.AMOUNT == amount
                ) {
                  sem.leave();
                  return res
                    .status(200)
                    .json({ status: "200", balance: user.balance[currency] });
                } else {
                  return res
                    .status(200)
                    .json({
                      status: "500",
                      msg: "Transaction already exist but has different content",
                    });
                }
              }
            } catch (error) {
              console.log(error, "debit error!")
            }
          }
        }
      }

    } else if (req.query.action == "credit") {
      const {
        callerPrefix,
        remote_id,
        username,
        session_id,
        currency,
        amount,
        game_id,
        transaction_id,
      } = req.query;
      console.log("credit", req.query);

      const session = await UserSession.findOne({
        "gameProfile.id": remote_id,
      });
      if(!session){
        sem.leave();
        return res.status(200).json({status: "403", msg: "Invalid Gameprofile!"})
      }
      const user = await MainUser.findOne({ _id: session.id });

      let queryList = [];
      Object.keys(req.query).map((key) => {
        if (key != "key") queryList.push(`${key}=${req.query[key]}`);
      });
      const queryString = queryList.join("&");
      if (
        req.query.key !=
        CryptoJS.SHA1(
          serverConf.gameAPI.BlueOcean.saltKey + queryString
        ).toString()
      ) {
        sem.leave();
        return res
          .status(200)
          .json({ status: "403", msg: "INCORRECT_KEY_VALIDATION" });
      } else {
        if (session == null) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "remote_id doesn't match" });
        } else if (session.gameProfile.username != callerPrefix + username) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else if (session.gameProfile.sessionid != session_id) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else if (parseFloat(amount) < 0) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "403", msg: "Amount is negative" });
        } else {
          if (user == null) {
            sem.leave();
            return res
              .status(200)
              .json({ status: "500", msg: "user can't find" });
          }
          else {
            try {
              const transaction = await BetHistory.findOne({
                transactionId: transaction_id,
                USERID: user._id,
              });
              if (transaction == null) {
                const update = {
                  $inc: {
                    [`balance.${currency}`]: Math.round(parseFloat(amount) * 100) / 100.0
                  }
                }
                const newUser = await MainUser.findOneAndUpdate(
                  { _id: user._id },
                  update,
                  { new: true, upsert: true }
                );
                const newTransaction = {
                  GAMEID: game_id,
                  USERID: user._id,
                  LAUNCHURL: "BlueOcean",
                  AMOUNT: amount,
                  TYPE: "WIN",
                  transactionId: transaction_id,
                  lastbalance: user.balance[currency],
                  updatedbalance: (
                    Math.round(
                      (parseFloat(user.balance[currency]) + parseFloat(amount)) *
                      100
                    ) / 100.0
                  ),
                  currency: currency,
                  result: "OK",
                };
                await BetHistory(newTransaction).save();
                sem.leave();
                return res
                  .status(200)
                  .json({ status: "200", balance: newUser.balance[currency] });
              } else if (transaction.LAUNCHURL != "BlueOcean") {
                return res
                  .status(200)
                  .json({ status: "500", msg: "Transaction not found" });
              } else {
                if (
                  transaction.USERID.toString() == user._id.toString() &&
                  transaction.TYPE == "WIN" &&
                  transaction.GAMEID == game_id &&
                  transaction.currency == currency &&
                  transaction.AMOUNT == amount
                ) {
                  sem.leave();
                  return res
                    .status(200)
                    .json({ status: "200", balance: user.balance[currency] });
                } else {
                  return res
                    .status(200)
                    .json({
                      status: "500",
                      msg: "Transaction already exist but has different content",
                    });
                }
              }
            } catch (error) {
              console.log(error, "credit error!")
            }
          }
        }
      }
    } else if (req.query.action == "rollback") {
      const {
        callerPrefix,
        remote_id,
        username,
        session_id,
        currency,
        amount,
        game_id,
        transaction_id,
      } = req.query;
      console.log("rollback", req.query);
      let queryList = [];
      Object.keys(req.query).map((key) => {
        if (key != "key") queryList.push(`${key}=${req.query[key]}`);
      });
      const queryString = queryList.join("&");
      if (
        req.query.key !=
        CryptoJS.SHA1(
          serverConf.gameAPI.BlueOcean.saltKey + queryString
        ).toString()
      ) {
        sem.leave();
        return res
          .status(200)
          .json({ status: "403", msg: "INCORRECT_KEY_VALIDATION" });
      } else {
        const session = await UserSession.findOne({
          "gameProfile.id": remote_id,
        });
        if (session == null) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "remote_id doesn't match" });
        } else if (session.gameProfile.username != callerPrefix + username) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else if (session.gameProfile.sessionid != session_id) {
          sem.leave();
          return res
            .status(200)
            .json({ status: "500", msg: "username doesn't match" });
        } else {
          const user = await MainUser.findOne({ _id: session.id });
          if (user == null){
            sem.leave();
            return res
              .status(200)
              .json({ status: "500", msg: "user can't find" });
          }
          else {
            const transaction = await BetHistory.findOne({
              transactionId: transaction_id,
              USERID: user._id,
            });
            console.log({ transactionId: transaction_id, USERID: user._id });
            console.log("rollback tran", transaction);
            if (transaction == null) {
              sem.leave();
              return res
                .status(200)
                .json({ status: "404", msg: "Transaction not found" });
            } else if (transaction.LAUNCHURL != "BlueOcean") {
              return res
                .status(200)
                .json({ status: "500", msg: "Transaction not found" });
            } else {
              if (transaction.result == "Canceled") {
                sem.leave();
                return res
                  .status(200)
                  .json({ status: "200", balance: transaction.lastbalance, msg: "Rollback already processed" });
              } else {
                try {
                  const newBalance = {
                    ...user.balance,
                    [currency]: Number(transaction.lastbalance),
                  };
                  const newUser = await MainUser.findOneAndUpdate(
                    { _id: user._id },
                    { $set: { balance: newBalance } },
                    { new: true, upsert: true }
                  );
                  const updateTransaction = await BetHistory.findOneAndUpdate(
                    { _id: transaction._id },
                    { result: "Canceled" },
                    { new: true, upsert: true }
                  );
                  sem.leave();
                  return res
                    .status(200)
                    .json({ status: "200", balance: newUser.balance[currency] });
                } catch {
                  sem.leave();
                  return res
                    .status(200)
                    .json({ status: "500", msg: "Transaction rollback failed." });
                }
              }
            }
          }
        }
      }
    }
  })


};

exports.ryan = async (req, res) => {
  if (req.query.action == "balance") {
    const { remote_id, username, currency, timestamp, key } = req.query;
    console.log("balance", req.query);
    if (
      key !=
      CryptoJS.MD5(timestamp + serverConf.gameAPI.Ryan.saltKey).toString()
    ) {
      return res.status(200).json({ error: 2, balance: 0 });
    } else {
      const session = await UserSession.findOne({
        "gameProfile.username": username,
      });
      if (session == null) {
        console.log("username doesn't match");
        return res.status(200).json({ error: 2, balance: 0 });
      } else {
        const user = await MainUser.findOne({ _id: session.id });
        if (user == null) {
          console.log("user can't find");
          return res.status(200).json({ error: 2, balance: 0 });
        } else {
          console.log("success", user.balance);
          return res
            .status(200)
            .json({
              error: 0,
              balance: parseFloat(user.balance[currency]) * 100,
            });
        }
      }
    }
  } else if (req.query.action == "debit") {
    const {
      remote_id,
      username,
      currency,
      amount,
      balance_required,
      type,
      gameplay_final,
      round_id,
      call_id,
      game_id,
      key,
      timestamp,
    } = req.query;
    console.log("debit", req.query);
    const session = await UserSession.findOne({
      "gameProfile.username": username,
    });
    const user = await MainUser.findOne({ _id: session._id });
    if (
      key !=
      CryptoJS.MD5(timestamp + serverConf.gameAPI.Ryan.saltKey).toString()
    ) {
      return res.status(200).json({ error: 2, balance: 0 });
    } else {
      if (session == null) {
        return res.status(200).json({ error: 2, balance: 0 });
      } else if (parseFloat(amount) < 0) {
        return res.status(200).json({ error: 2, balance: 0 });
      } else {
        if (user == null) return res.status(200).json({ error: 2, balance: 0 });
        else if (
          parseFloat(user.balance[currency]) <
          parseFloat(amount) / 100
        ) {
          return res
            .status(200)
            .json({ error: 1, balance: parseFloat(user.balance[currency]) });
        } else {
          const update = {
            $inc: {
              [`balance.${currency}`]: -1 * parseFloat(amount) / 100
            }
          }
          const newUser = await MainUser.findOneAndUpdate(
            { _id: user._id },
            update,
            { new: true, upsert: true }
          );
          const newTransaction = {
            GAMEID: game_id,
            USERID: user._id,
            LAUNCHURL: "Ryan",
            AMOUNT: parseFloat(amount) / 100,
            TYPE: "BET",
            transactionId: `Ryan-${timestamp}`,
            lastbalance: user.balance[currency],
            updatedbalance: (
              Math.round(
                (parseFloat(user.balance[currency]) -
                  parseFloat(amount) / 100) *
                100
              ) / 100.0
            ),
            currency: currency,
            result: "OK",
          };
          await BetHistory(newTransaction).save();
          //add wager value increasement
          const game = await GameLists.findOne({ gameId: game_id });
          const get_user_bonus = await BonusArchive.findOne({
            userId: user._id,
            status: "active",
          });
          if (get_user_bonus) {
            if (
              Number(get_user_bonus.detail.WageringTotal) +
              ((amount / 100) * game.percentage) / 100 >=
              Number(get_user_bonus.detail.Wagering)
            ) {
              get_user_bonus.status = "completed";
              get_user_bonus.detail = {
                ...get_user_bonus.detail,
                WageringTotal:
                  get_user_bonus.detail.WageringTotal +
                  (amount * game.percentage) / 100 / 100,
              };
              await get_user_bonus.save();
              //convert the bonus amount to user's real balance
              newUser.balance = {
                ...newUser.balance,
                [currency]: (
                  Math.round(parseFloat(newUser.balance[currency]) * 100) /
                  100.0 +
                  parseFloat(get_user_bonus.detail.amount)
                ),
              };
              if (
                newUser.bonus_balance > 0 &&
                newUser.bonus_balance >= get_user_bonus.detail.amount
              ) {
                newUser.bonus_balance =
                  Math.round(
                    (newUser.bonus_balance - get_user_bonus.detail.amount) * 100
                  ) / 100;
                await newUser.save();
              }
            }
            //add the wageringTotal value
            else {
              await BonusArchive.findOneAndUpdate(
                { userId: user._id, status: "active" },
                {
                  $inc: {
                    "detail.WageringTotal":
                      (amount * game.percentage) / 100 / 100,
                  },
                }
              );
            }
          }
          return res
            .status(200)
            .json({
              error: 0,
              balance: parseFloat(newUser.balance[currency]) * 100,
            });
        }
      }
    }
  } else if (req.query.action == "credit") {
    const {
      remote_id,
      username,
      currency,
      amount,
      balance_required,
      type,
      gameplay_final,
      round_id,
      call_id,
      game_id,
      key,
      timestamp,
    } = req.query;
    console.log("credit", req.query);
    if (
      key !=
      CryptoJS.MD5(timestamp + serverConf.gameAPI.Ryan.saltKey).toString()
    ) {
      return res.status(200).json({ error: 2, balance: 0 });
    } else {
      const session = await UserSession.findOne({
        "gameProfile.username": username,
      });
      if (session == null) {
        return res.status(200).json({ error: 2, balance: 0 });
      } else if (parseFloat(amount) / 100 < 0) {
        return res.status(200).json({ error: 2, balance: 0 });
      } else {
        const user = await MainUser.findOne({ _id: session.id });
        if (user == null) return res.status(200).json({ error: 2, balance: 0 });
        else {
          //bonus funds
          if (req.query.type == "bonus_fs") {
            const getFreeSpins = await baseController.axiosRequest(
              serverConf.gameAPI.Ryan.hostURL,
              {
                api_login: serverConf.gameAPI.Ryan.api_login,
                api_password: serverConf.gameAPI.Ryan.api_password,
                method: "getFreeRounds",
                user_username: user.username,
                user_password: user.password,
                currency: user.dis_currency,
              },
              "POST"
            );
            if (getFreeSpins) {
              if (getFreeSpins.response && getFreeSpins.response.length > 0) {
                getFreeSpins.response.map(async (item) => {
                  if (item.game_id == game_id) {
                    const fs_data = await FreeSpinHistory.findOne({
                      userId: user._id,
                      gameid: game_id,
                    });
                    const game_info = await GameLists.findOne({
                      gameId: game_id,
                    });
                    if (fs_data) {
                      fs_data.fs_amount =
                        item.freespins - item.freespins_performed;
                      fs_data.win_amount = item.freespins_wallet / 100;
                      fs_data.wager_requirement =
                        (item.freespins_wallet / 100) * 70;
                      fs_data.status =
                        item.freespins - item.freespins_performed == 0
                          ? "active"
                          : "pending";
                      fs_data.expire_at = new Date(
                        Date.now() + 3 * 24 * 60 * 60 * 1000
                      );
                      await fs_data.save();
                    } else {
                      const newFsHistory = {
                        userId: user._id,
                        gameid: game_id,
                        fs_amount: item.freespins - item.freespins_performed,
                        win_amount: item.freespins_wallet / 100,
                        wager_requirement: (item.freespins_wallet / 100) * 70,
                        slug: game_info.slug,
                        status: "active",
                        expire_at: new Date(
                          Date.now() + 3 * 24 * 60 * 60 * 1000
                        ),
                      };
                      await FreeSpinHistory(newFsHistory).save();
                    }
                  }
                });
              }
            }
            console.log(getFreeSpins.response, "getFreeSpins================>");
            return res
              .status(200)
              .json({
                error: 0,
                balance: parseFloat(user.balance[currency]) * 100,
              });
          } else {
            const newBalance = {
              ...user.balance,
              [currency]:
                Number((parseFloat(user.balance[currency])
                  + parseFloat(amount) / 100).toFixed(2))
            };
            const updateUser = await MainUser.findOneAndUpdate(
              { _id: user._id },
              { balance: newBalance },
              { new: true, upsert: true }
            );
            const newTransaction = {
              GAMEID: game_id,
              USERID: user._id,
              LAUNCHURL: "Ryan",
              AMOUNT: parseFloat(amount) / 100,
              TYPE: "WIN",
              transactionId: `Ryan-${timestamp}`,
              lastbalance: user.balance[currency],
              updatedbalance: (
                Math.round(
                  (parseFloat(user.balance[currency]) +
                    parseFloat(amount) / 100) *
                  100
                ) / 100.0
              ),
              currency: currency,
              result: "OK",
            };
            await BetHistory(newTransaction).save();
            return res
              .status(200)
              .json({
                error: 0,
                balance: parseFloat(updateUser.balance[currency]) * 100,
              });
          }
        }
      }
    }
  }
};
