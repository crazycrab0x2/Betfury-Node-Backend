const requestIp = require("request-ip");
const referralCodes = require("referral-codes");

const baseController = require("./baseController");
const configController = require("./configController");

const { MainUser, UserSession, BetHistory } = require("../models");

const mainConfig = require("../config");
const serverConf = require("../../serverConf");
const crypto = require("crypto");
const ObjectId = require("mongoose").Types.ObjectId;
const jwt = require("jsonwebtoken");

// Authentication
exports.authenticate = async (req, res) => {
  console.log(req.body);
  //validate header X-Authrization
  if (
    req.headers["x-authorization"] !=
    crypto
      .createHash("sha1")
      .update("authenticate" + serverConf.gameAPI.casinoGoild.secretKey)
      .digest("hex")
  ) {
    return res.status(403).send("Access denied");
  } else {
    // validate hash
    if (
      req.body.hash !=
      crypto
        .createHash("sha1")
        .update(
          req.body.command +
            req.body.request_timestamp +
            serverConf.gameAPI.casinoGoild.secretKey
        )
        .digest("hex")
    ) {
      const now = new Date();
      const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
      const resData = {
        request: { ...req.body },
        response: {
          status: "ERROR",
          response_timestamp: currentTime,
          hash: crypto
            .createHash("sha1")
            .update(
              "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
            )
            .digest("hex"),
          data: {
            error_code: "OP_20",
            error_message: "Invalid Hash",
          },
        },
      };
      return res.status(200).send(resData);
    } else {
      const session = await UserSession.findOne({
        hash: req.body.data.token.slice(0, 40),
      });
      //validate token of request body
      if (session == null) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_21",
              error_message: "Invalid Token",
            },
          },
        };
        return res.status(200).send(resData);
      } else {
        const user = await MainUser.findOne({ _id: session.id });
        const token = baseController.decrypt(session.token);
        if (user == null) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_50",
                error_message: "Player is not found",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (new Date().getTime() - token.timestamp > 3600000) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_22",
                error_message: "Authrization failed",
              },
            },
          };
          return res.status(200).send(resData);
        } else {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "OK",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "OK" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                user_id: user._id.toString(),
                user_name: user.username,
                user_country: user.country,
                display_name: user.username,
                group: user.username,
                currency_code: user.dis_currency,
                balance: user.balance[user.dis_currency],
              },
            },
          };
          return res.status(200).send(resData);
        }
      }
    }
  }
};  

// Balance
exports.balance = async (req, res) => {
  //validate header X-Authrization
  if (
    req.headers["x-authorization"] !=
    crypto
      .createHash("sha1")
      .update("balance" + serverConf.gameAPI.casinoGoild.secretKey)
      .digest("hex")
  ) {
    return res.status(403).send("Access denied");
  } else {
    //validate hash
    if (
      req.body.hash !=
      crypto
        .createHash("sha1")
        .update(
          req.body.command +
            req.body.request_timestamp +
            serverConf.gameAPI.casinoGoild.secretKey
        )
        .digest("hex")
    ) {
      const now = new Date();
      const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
      const resData = {
        request: { ...req.body },
        response: {
          status: "ERROR",
          response_timestamp: currentTime,
          hash: crypto
            .createHash("sha1")
            .update(
              "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
            )
            .digest("hex"),
          data: {
            error_code: "OP_20",
            error_message: "Invalid Hash",
          },
        },
      };
      return res.status(200).send(resData);
    } else {
      const session = await UserSession.findOne({
        hash: req.body.data.token.slice(0, 40),
      });
      //validate token of request body
      if (session == null) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_21",
              error_message: "Invalid Token",
            },
          },
        };
        return res.status(200).send(resData);
      } else {
        const user = await MainUser.findOne({ _id: session.id });
        if (user._id.toString() != req.body.data.user_id) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_34",
                error_message: "Player not found",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (user.status == "block") {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_33",
                error_message: "Player is blocked",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (user.dis_currency != req.body.data.currency_code) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_30",
                error_message: "invalid currency",
              },
            },
          };
          return res.status(200).send(resData);
        } else {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "OK",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "OK" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                balance: user.balance[req.body.data.currency_code],
                currency_code: req.body.data.currency_code,
              },
            },
          };
          return res.status(200).send(resData);
        }
      }
    }
  }
};

// change Balance
exports.changeBalance = async (req, res) => {
  //validate header X-Authrization
  if (
    req.headers["x-authorization"] !=
    crypto
      .createHash("sha1")
      .update("changebalance" + serverConf.gameAPI.casinoGoild.secretKey)
      .digest("hex")
  ) {
    return res.status(403).send("Access denied");
  } else {
    //validate hash
    if (
      req.body.hash !=
      crypto
        .createHash("sha1")
        .update(
          req.body.command +
            req.body.request_timestamp +
            serverConf.gameAPI.casinoGoild.secretKey
        )
        .digest("hex")
    ) {
      const now = new Date();
      const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
      const resData = {
        request: { ...req.body },
        response: {
          status: "ERROR",
          response_timestamp: currentTime,
          hash: crypto
            .createHash("sha1")
            .update(
              "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
            )
            .digest("hex"),
          data: {
            error_code: "OP_20",
            error_message: "Invalid Hash",
          },
        },
      };
      return res.status(200).send(resData);
    } else {
      const session = await UserSession.findOne({
        hash: req.body.data.token.slice(0, 40),
      });
      //validate token of request body
      if (session == null) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_21",
              error_message: "Invalid Token",
            },
          },
        };
        return res.status(200).send(resData);
      } else {
        const user = await MainUser.findOne({ _id: session.id });
        if (user == null) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_34",
                error_message: "Player Not Found",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (user._id.toString() != req.body.data.user_id) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_34",
                error_message: "Player Not Found",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (user.dis_currency != req.body.data.currency_code) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_30",
                error_message: "Invalid currency",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (
          req.body.data.transaction_type == "BET" &&
          user.balance[user.dis_currency] < req.body.data.amount
        ) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_31",
                error_message: "Insufficient funds",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (user.status == "block") {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_33",
                error_message: "Player is blocked",
              },
            },
          };
          return res.status(200).send(resData);
        } else {
          const transaction = await BetHistory.findOne({
            transactionId: req.body.data.transaction_id,
          });
          if (transaction != null) {
            if (
              transaction.transactionId == req.body.data.transaction_id &&
              transaction.USERID.toString() == req.body.data.user_id &&
              transaction.TYPE == req.body.data.transaction_type &&
              transaction.GAMEID == req.body.data.game_id &&
              transaction.currency == req.body.data.currency_code &&
              transaction.AMOUNT == req.body.data.amount
            ) {
              const now = new Date();
              const currentTime = now
                .toISOString()
                .replace("T", " ")
                .slice(0, 19);
              const resData = {
                request: { ...req.body },
                response: {
                  status: "OK",
                  response_timestamp: currentTime,
                  hash: crypto
                    .createHash("sha1")
                    .update(
                      "OK" +
                        currentTime +
                        serverConf.gameAPI.casinoGoild.secretKey
                    )
                    .digest("hex"),
                  data: {
                    currency_code: req.body.data.currency_code,
                    balance: user.balance[req.body.data.currency_code],
                  },
                },
              };
              return res.status(200).send(resData);
            } else {
              const now = new Date();
              const currentTime = now
                .toISOString()
                .replace("T", " ")
                .slice(0, 19);
              const resData = {
                request: { ...req.body },
                response: {
                  status: "ERROR",
                  response_timestamp: currentTime,
                  hash: crypto
                    .createHash("sha1")
                    .update(
                      "ERROR" +
                        currentTime +
                        serverConf.gameAPI.casinoGoild.secretKey
                    )
                    .digest("hex"),
                  data: {
                    error_code: "OP_40",
                    error_message: "Duplicated transaction ID",
                  },
                },
              };
              return res.status(200).send(resData);
            }
          } else {
            const newTransaction = {
              GAMEID: req.body.data.game_id,
              USERID: req.body.data.user_id,
              LAUNCHURL: "CasinoGold",
              AMOUNT: req.body.data.amount,
              TYPE: req.body.data.transaction_type,
              transactionId: req.body.data.transaction_id,
              lastbalance: user.balance[req.body.data.currency_code],
              updatedbalance:
                req.body.data.transaction_type == "BET"
                  ? (
                      Math.round(
                        (parseFloat(user.balance[req.body.data.currency_code]) -
                          parseFloat(req.body.data.amount)) *
                          100
                      ) / 100.0
                    )
                  : (
                      Math.round(
                        (parseFloat(user.balance[req.body.data.currency_code]) +
                          parseFloat(req.body.data.amount)) *
                          100
                      ) / 100.0
                    ),
              currency: req.body.data.currency_code,
              result: "OK",
            };
            const transactionResult = await BetHistory(newTransaction).save();
            if (transactionResult == null) {
              const now = new Date();
              const currentTime = now
                .toISOString()
                .replace("T", " ")
                .slice(0, 19);
              const resData = {
                request: { ...req.body },
                response: {
                  status: "ERROR",
                  response_timestamp: currentTime,
                  hash: crypto
                    .createHash("sha1")
                    .update(
                      "ERROR" +
                        currentTime +
                        serverConf.gameAPI.casinoGoild.secretKey
                    )
                    .digest("hex"),
                  data: {
                    error_code: "OP_49",
                    error_message: "Operation failed",
                  },
                },
              };
              return res.status(200).send(resData);
            } else {
              const newBalance = {
                ...user.balance,
                [req.body.data.currency_code]:
                  req.body.data.transaction_type == "BET"
                    ? (
                        Math.round(
                          (parseFloat(
                            user.balance[req.body.data.currency_code]
                          ) -
                            parseFloat(req.body.data.amount)) *
                            100
                        ) / 100.0
                      )
                    : (
                        Math.round(
                          (parseFloat(
                            user.balance[req.body.data.currency_code]
                          ) +
                            parseFloat(req.body.data.amount)) *
                            100
                        ) / 100.0
                      ),
              };
              const newUser = await MainUser.findOneAndUpdate(
                { _id: req.body.data.user_id },
                { $set: { balance: newBalance } },
                { new: true }
              );
              const now = new Date();
              const currentTime = now
                .toISOString()
                .replace("T", " ")
                .slice(0, 19);
              const resData = {
                request: { ...req.body },
                response: {
                  status: "OK",
                  response_timestamp: currentTime,
                  hash: crypto
                    .createHash("sha1")
                    .update(
                      "OK" +
                        currentTime +
                        serverConf.gameAPI.casinoGoild.secretKey
                    )
                    .digest("hex"),
                  data: {
                    currency_code: req.body.data.currency_code,
                    balance: newUser.balance[req.body.data.currency_code],
                  },
                },
              };
              //add wager value increasement
              if (req.body.data.transaction_type == "BET") {
                console.log("CasinoGold bet++++++++++++++++++++++");
                const game = await GameLists.findOne({ gameId: game_id });
                const get_user_bonus = await BonusArchive.findOne({
                  userId: user._id,
                  status: "active",
                });
                if (
                  get_user_bonus.WageringTotal + req.body.data.amount >=
                  get_user_bonus.Wagering
                ) {
                  get_user_bonus.status = "completed";
                  get_user_bonus.save();
                  //convert the bonus amount to user's real balance
                  await MainUser.findOneAndUpdate(
                    { _id: user._id },
                    {
                      $inc: {
                        [`balance.${req.body.data.currency_code}`]:
                          get_user_bonus.amount,
                      },
                    }
                  );
                }
                //add the wageringTotal value
                else {
                  await BonusArchive.findOneAndUpdate(
                    { userId: user._id, status: "active" },
                    {
                      $inc: {
                        "detail.WageringTotal":
                          (req.body.data.amount * game.percentage) / 100,
                      },
                    }
                  );
                }
              }
              return res.status(200).send(resData);
            }
          }
        }
      }
    }
  }
};

// status
exports.status = async (req, res) => {
  //validate header X-Authrization
  if (
    req.headers["x-authorization"] !=
    crypto
      .createHash("sha1")
      .update("status" + serverConf.gameAPI.casinoGoild.secretKey)
      .digest("hex")
  ) {
    return res.status(403).send("Access denied");
  } else {
    //validate hash
    if (
      req.body.hash !=
      crypto
        .createHash("sha1")
        .update(
          req.body.command +
            req.body.request_timestamp +
            serverConf.gameAPI.casinoGoild.secretKey
        )
        .digest("hex")
    ) {
      const now = new Date();
      const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
      const resData = {
        request: { ...req.body },
        response: {
          status: "ERROR",
          response_timestamp: currentTime,
          hash: crypto
            .createHash("sha1")
            .update(
              "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
            )
            .digest("hex"),
          data: {
            error_code: "OP_20",
            error_message: "Invalid Hash",
          },
        },
      };
      return res.status(200).send(resData);
    } else {
      let user_id;
      try {
        user_id = new ObjectId(req.body.data.user_id);
      } catch (err) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_34",
              error_message: "Player Not Found",
            },
          },
        };
        return res.status(200).send(resData);
      }
      const user = await MainUser.findOne({ _id: user_id });
      if (user == null) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_34",
              error_message: "Player Not Found",
            },
          },
        };
        return res.status(200).send(resData);
      } else {
        const transaction = await BetHistory.findOne({
          transactionId: req.body.data.transaction_id,
        });
        if (transaction == null) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_41",
                error_message: "Transaction not found",
              },
            },
          };
          return res.status(200).send(resData);
        } else {
          if (transaction.TYPE != req.body.data.transaction_type) {
            const now = new Date();
            const currentTime = now
              .toISOString()
              .replace("T", " ")
              .slice(0, 19);
            const resData = {
              request: { ...req.body },
              response: {
                status: "ERROR",
                response_timestamp: currentTime,
                hash: crypto
                  .createHash("sha1")
                  .update(
                    "ERROR" +
                      currentTime +
                      serverConf.gameAPI.casinoGoild.secretKey
                  )
                  .digest("hex"),
                data: {
                  error_code: "OP_50",
                  error_message: "Transaction type not match",
                },
              },
            };
            return res.status(200).send(resData);
          } else if (
            transaction.createdAt.toISOString().slice(0, 10) !=
            req.body.data.transaction_date
          ) {
            const now = new Date();
            const currentTime = now
              .toISOString()
              .replace("T", " ")
              .slice(0, 19);
            const resData = {
              request: { ...req.body },
              response: {
                status: "ERROR",
                response_timestamp: currentTime,
                hash: crypto
                  .createHash("sha1")
                  .update(
                    "ERROR" +
                      currentTime +
                      serverConf.gameAPI.casinoGoild.secretKey
                  )
                  .digest("hex"),
                data: {
                  error_code: "OP_50",
                  error_message: "Created data not match",
                },
              },
            };
            return res.status(200).send(resData);
          } else {
            const now = new Date();
            const currentTime = now
              .toISOString()
              .replace("T", " ")
              .slice(0, 19);
            const resData = {
              request: { ...req.body },
              response: {
                status: "OK",
                response_timestamp: currentTime,
                hash: crypto
                  .createHash("sha1")
                  .update(
                    "OK" +
                      currentTime +
                      serverConf.gameAPI.casinoGoild.secretKey
                  )
                  .digest("hex"),
                data: {
                  user_id: req.body.data.user_id,
                  transaction_id: req.body.data.transaction_id,
                  transaction_status: "OK",
                },
              },
            };
            return res.status(200).send(resData);
          }
        }
      }
    }
  }
};

// cancel
exports.cancel = async (req, res) => {
  //validate header X-Authrization
  if (
    req.headers["x-authorization"] !=
    crypto
      .createHash("sha1")
      .update("cancel" + serverConf.gameAPI.casinoGoild.secretKey)
      .digest("hex")
  ) {
    return res.status(403).send("Access denied");
  } else {
    //validate hash
    if (
      req.body.hash !=
      crypto
        .createHash("sha1")
        .update(
          req.body.command +
            req.body.request_timestamp +
            serverConf.gameAPI.casinoGoild.secretKey
        )
        .digest("hex")
    ) {
      const now = new Date();
      const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
      const resData = {
        request: { ...req.body },
        response: {
          status: "ERROR",
          response_timestamp: currentTime,
          hash: crypto
            .createHash("sha1")
            .update(
              "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
            )
            .digest("hex"),
          data: {
            error_code: "OP_20",
            error_message: "Invalid Hash",
          },
        },
      };
      return res.status(200).send(resData);
    } else {
      let user_id;
      try {
        user_id = new ObjectId(req.body.data.user_id);
      } catch (err) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_34",
              error_message: "Player Not Found",
            },
          },
        };
        return res.status(200).send(resData);
      }
      const user = await MainUser.findOne({ _id: user_id });
      if (user == null) {
        const now = new Date();
        const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
        const resData = {
          request: { ...req.body },
          response: {
            status: "ERROR",
            response_timestamp: currentTime,
            hash: crypto
              .createHash("sha1")
              .update(
                "ERROR" + currentTime + serverConf.gameAPI.casinoGoild.secretKey
              )
              .digest("hex"),
            data: {
              error_code: "OP_34",
              error_message: "Player Not Found",
            },
          },
        };
        return res.status(200).send(resData);
      } else {
        const transaction = await BetHistory.findOne({
          transactionId: req.body.data.transaction_id,
        });
        if (transaction == null) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_41",
                error_message: "Transaction not found",
              },
            },
          };
          return res.status(200).send(resData);
        } else if (transaction.USERID.toString() != user._id.toString()) {
          const now = new Date();
          const currentTime = now.toISOString().replace("T", " ").slice(0, 19);
          const resData = {
            request: { ...req.body },
            response: {
              status: "ERROR",
              response_timestamp: currentTime,
              hash: crypto
                .createHash("sha1")
                .update(
                  "ERROR" +
                    currentTime +
                    serverConf.gameAPI.casinoGoild.secretKey
                )
                .digest("hex"),
              data: {
                error_code: "OP_50",
                error_message:
                  "Transaction's user_id not match request's user_id",
              },
            },
          };
          return res.status(200).send(resData);
        } else {
          if (
            transaction.transactionId == req.body.data.transaction_id &&
            transaction.USERID.toString() == req.body.data.user_id &&
            transaction.TYPE == req.body.data.transaction_type &&
            transaction.GAMEID == req.body.data.game_id &&
            transaction.currency == req.body.data.currency_code &&
            transaction.AMOUNT == req.body.data.amount
          ) {
            if (transaction.result == "canceled") {
              const now = new Date();
              const currentTime = now
                .toISOString()
                .replace("T", " ")
                .slice(0, 19);
              const resData = {
                request: { ...req.body },
                response: {
                  status: "OK",
                  response_timestamp: currentTime,
                  hash: crypto
                    .createHash("sha1")
                    .update(
                      "OK" +
                        currentTime +
                        serverConf.gameAPI.casinoGoild.secretKey
                    )
                    .digest("hex"),
                  data: {
                    user_id: req.body.data.user_id,
                    transaction_id: req.body.data.transaction_id,
                    transaction_status: "CANCELED",
                  },
                },
              };
              return res.status(200).send(resData);
            } else {
              const newBalance = {
                ...user.balance,
                [transaction.currency]:
                  transaction.TYPE == "BET"
                    ? (
                        Math.round(
                          (parseFloat(user.balance[transaction.currency]) +
                            parseFloat(transaction.AMOUNT)) *
                            100
                        ) / 100.0
                      )
                    : (
                        Math.round(
                          (parseFloat(user.balance[transaction.currency]) -
                            parseFloat(transaction.AMOUNT)) *
                            100
                        ) / 100.0
                      ),
              };
              const newUser = await MainUser.findOneAndUpdate(
                { _id: req.body.data.user_id },
                { $set: { balance: newBalance } },
                { new: true }
              );
              const updateTransaction = await BetHistory.findOneAndUpdate(
                { transactionId: req.body.data.transaction_id },
                { result: "canceled" },
                { new: true }
              );
              if (deletedTransaction == null) {
                const now = new Date();
                const currentTime = now
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19);
                const resData = {
                  request: { ...req.body },
                  response: {
                    status: "ERROR",
                    response_timestamp: currentTime,
                    hash: crypto
                      .createHash("sha1")
                      .update(
                        "ERROR" +
                          currentTime +
                          serverConf.gameAPI.casinoGoild.secretKey
                      )
                      .digest("hex"),
                    data: {
                      error_code: "OP_49",
                      error_message: "failed to cancel transaction",
                    },
                  },
                };
                return res.status(200).send(resData);
              } else {
                const now = new Date();
                const currentTime = now
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19);
                const resData = {
                  request: { ...req.body },
                  response: {
                    status: "OK",
                    response_timestamp: currentTime,
                    hash: crypto
                      .createHash("sha1")
                      .update(
                        "OK" +
                          currentTime +
                          serverConf.gameAPI.casinoGoild.secretKey
                      )
                      .digest("hex"),
                    data: {
                      user_id: req.body.data.user_id,
                      transaction_id: req.body.data.transaction_id,
                      transaction_status: "CANCELED",
                    },
                  },
                };
                return res.status(200).send(resData);
              }
            }
          } else {
            const now = new Date();
            const currentTime = now
              .toISOString()
              .replace("T", " ")
              .slice(0, 19);
            const resData = {
              request: { ...req.body },
              response: {
                status: "ERROR",
                response_timestamp: currentTime,
                hash: crypto
                  .createHash("sha1")
                  .update(
                    "ERROR" +
                      currentTime +
                      serverConf.gameAPI.casinoGoild.secretKey
                  )
                  .digest("hex"),
                data: {
                  error_code: "OP_50",
                  error_message: "Transaction exist, content is different",
                },
              },
            };
            return res.status(200).send(resData);
          }
        }
      }
    }
  }
};

const getlaunchURL = (operator_id) => {
  let url;
  Object.keys(serverConf.gameAPI).map((provider) => {
    if (serverConf.gameAPI[provider].operatorID == operator_id) {
      url = serverConf.gameAPI[provider].gameLunchURL;
    }
  });
  return url;
};
