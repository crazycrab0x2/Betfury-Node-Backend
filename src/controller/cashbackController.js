
const { MainUser, Cashback, BalanceHistory } = require("../models");
const tblConfig = require("../config/tablemanage");
const { default: mongoose } = require("mongoose");

exports.handleCashback = async () => {
    const players_list = await MainUser.aggregate([
        {
            $lookup: {
                from: tblConfig.user_balancehistory,
                localField: "_id",
                foreignField: "userid",
                as: "balanceHistory"
            }
        },
        {
            $unwind: "$balanceHistory"
        },
        {
            $match: {
                "balanceHistory.paymentType": "deposit",
                "balanceHistory.status": {
                    $in: ["finished", "partially_paid"]
                },
                "balanceHistory.updatedAt": {
                    //from 00:00 to 23:59 previous day
                    $gte: new Date(Date.now() - 24 * 3600 * 1000),
                    $lt: new Date(Date.now() - 2 * 3600 * 1000),
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                firstname: { $first: "$firstname" },
                lastname: { $first: "$username" },
                depositTotal: { $sum: "$balanceHistory.amount" },
            }
        },
    ]);

    if (!players_list) {
        return false;
    }

    players_list.map(async (player) => {
        const cashback_amount = await this.calculateCashbackAmount(player._id);
        if (cashback_amount > 0) {
            const newCashbackSchema = {
                user_id: player._id,
                amount: Number(cashback_amount.toFixed(2)),
                status: "claim",
                is_claimed: true,
                created_at: Date.now(),
                claimed_at: null,
                deposit: Number(player.depositTotal.toFixed(2)),
                wager_requirement: Number((cashback_amount * 3).toFixed(2)),
                wagered_amount: 0,
                expire_at: Date.now() + 7 * 24 * 3600 * 1000,
                max_win: Number((player.depositTotal * 6).toFixed(2)),
            }
            await Cashback(newCashbackSchema).save();
        }
    })
}

exports.calculateCashbackAmount = async (userId) => {

    const user = await MainUser.findOne({ _id: userId });
    if (!user) {
        return false;
    }

    const userLists = await BalanceHistory.find(
        {
            userid: userId,
            paymentType: "deposit",
            status: { $in: ["finished", "partially_paid"] },
            updatedAt: {
                //from 00:00 to 23:59 previous day
                $gte: new Date(Date.now() - 24 * 3600 * 1000),
                $lt: new Date(Date.now() - 2 * 3600 * 1000)
            }
        }
    )

    if (userLists.length === 0) {
        return false;
    }

    let total_deposit = 0;

    userLists.map(user => {
        total_deposit += user.amount;
    })

    //The total deposit money from the previous day should be more than 20$.
    if (total_deposit < 20) {
        return false;
    }

    //User must lose at least 20$ previous day from the total deposits.
    if (total_deposit - 20 < user.balance[user.currency]) {
        return false;
    }

    let cashbackAmount = 0;

    /**
     * Calculate cashback amount based on deposit amount as below
     * 10%	USD 20 - USD 499
     * 11%	USD 500 - USD 699
     * 12%	USD 700 - USD 799
     * 13%	USD 800 - USD 999
     * 14%	USD 1000 - USD 1499
     * 15%	USD 1500 - USD 1999
     * 16%	USD 2000 - USD 2499
     * 17%	USD 2500 - USD 3499
     * 18%	USD 3500 - USD 3999
     * 19%	USD 4000 - USD 4999
     * 20%	USD 5000 or more
     */

    if (total_deposit <= 499) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.1;
    } else if (total_deposit >= 500 && total_deposit <= 699) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.11;
    } else if (total_deposit >= 700 && total_deposit <= 799) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.12;
    } else if (total_deposit >= 800 && total_deposit <= 999) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.13;
    } else if (total_deposit >= 1000 && total_deposit <= 1499) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.14;
    } else if (total_deposit >= 1500 && total_deposit <= 1999) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.15;
    } else if (total_deposit >= 2000 && total_deposit <= 2499) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.16;
    } else if (total_deposit >= 2500 && total_deposit <= 3499) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.17;
    } else if (total_deposit >= 3500 && total_deposit <= 3999) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.18;
    } else if (total_deposit >= 4000 && total_deposit <= 4999) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.19;
    } else if (total_deposit >= 5000) {
        cashbackAmount = (total_deposit - user.balance[user.currency]) * 0.2;
    }

    return cashbackAmount;

}

exports.getCashbackHistory = async (req, res) => {
    const user = req.user;
    const cb_lists_update = await Cashback.find({ user_id: user._id })
    await Promise.all(
        cb_lists_update.map(async (cb) => {
            if (cb.expire_at <= new Date(Date.now())
                && cb.status == "claim") {
                cb.status = "expired"
                await cb.save();
            }
        })
    )
    const cb_lists = await Cashback.aggregate([
        {
            $match: {
                user_id: user._id
            }
        },
        {
            $project: {
                _id: 0,
                amount: 1,
                wager_requirement: 1,
                wagered_amount: 1,
                deposit: 1,
                status: 1,
                created_at: 1,
                expire_at: {
                    $dateToString:
                        { format: "%Y-%m-%d", date: "$expire_at" }
                }
            }
        }
    ])

    if (cb_lists) {
        res.send({ msg: "success", data: cb_lists })
    }
    else {
        res.send("no data");
    }
}

exports.isClaimed = async (req, res) => {
    const { user } = req;
    const io = req.app.get("socketio");
    const cashbackLists = await Cashback.find(
        {
            user_id: user._id
        }
    )
    let claimResult = false
    if (cashbackLists) {
        await Promise.all(
            cashbackLists.map(async (item, index) => {
                if ((index + 1) == req.body.id && item.status == "claim") {
                    item.status = "completed"
                    item.is_claimed = true
                    item.claimed_at = Date.now()
                    await item.save()
                    //Convert the cashback amount into real balance.
                    const update = {
                        [`balance.${user.currency}`]:
                            Math.round(parseFloat(user.balance[user.currency] +
                                item.amount) * 100) / 100
                    }
                    const result = await MainUser.findOneAndUpdate(
                        { _id: user._id },
                        {
                            $set: update
                        },
                        { new: true, upsert: true }
                    )
                    if (result) {
                        io.sockets.emit("updateBalance", { balance: result.balance, id: result._id })
                    }
                    claimResult = true

                    //socket handler
                    //Email service handler

                }
            })
        )
    }

    if (claimResult) {
        res.status(200).json({ msg: 'success' })
    } else {
        res.status(400).json({ msg: 'no such record' })
    }

}