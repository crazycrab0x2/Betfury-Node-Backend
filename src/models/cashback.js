const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const cashbackSchema = mongoose.Schema({
    user_id: {type: Schema.Types.ObjectId},
    amount: {type: Number},
    status: {type: String},
    is_claimed: {type: Boolean},
    claimed_at: {type: Date},
    deposit: {type: Number},
    wager_requirement: {type: Number},
    wagered_amount: {type: Number},
    expire_at: {type: Date}, 
    max_win: {type: Number},
})

module.exports = {
    Cashback: mongoose.model(tblConfig.cashback_lists, cashbackSchema)
}