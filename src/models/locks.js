const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const tblConfig = require("../config/tablemanage");

const balanceLocks = new Schema({
    resourceId: {type: String, required: true}, 
    lockedBy: {type: String, required: true},
    lockedAt: {type: Date, default: Date.now()},
})

module.exports = {
    Locks: mongoose.model(tblConfig.balance_locks, balanceLocks)
}