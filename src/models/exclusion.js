const mongoose = require('mongoose')
const tblConfig = require("../config/tablemanage")
const Schema = mongoose.Schema

const depositPeriodListSchema = new Schema({
    dperiodDuration: {
        type: String,
    }
})

const coolOfPeriodListSchema = new Schema({
    no: {
        type: Number,
        require: true,
    },
    duration: {
        type: String,
    }
})

module.exports = {
    depositPeriodList: mongoose.model(
        tblConfig.deposit_period_list,
        depositPeriodListSchema
    ),
    coolOfPeriodList: mongoose.model(
        tblConfig.coolof_period_list, 
        coolOfPeriodListSchema
    ),
}
