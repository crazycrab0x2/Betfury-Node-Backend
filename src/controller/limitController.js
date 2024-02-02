const { MainUser, coolOfPeriodList } = require("../models")
const { accountBlockCron } = require("./baseController")

exports.getCODlist = async (req, res) => {
    const getList = await coolOfPeriodList.find().sort({ no: 1 })
    let codList = []
    if (getList.length > 0) {
        getList.map((item) => {
            codList.push(item.duration)
        })
    }
    return res.status(200).json({ msg: "success", data: codList })
}

exports.setCODLimit = async (req, res) => {
    const { user } = req
    const { data } = req.body
    try {
        let dayUnit = 0;
        const dayNum = Number(data.charAt(0))
        if (data) {
            switch (data.slice(2)) {
                case "week":
                case "weeks":
                    dayUnit = 24 * 7
                    break
                case "day":
                case "days":
                    dayUnit = 24
                    break
                case "month":
                case "months":
                    dayUnit = 24 * 30
                    break
            }
        }
        const blockDay = Date.now() + 3600 * 1000 * dayNum * dayUnit
        const second = new Date(blockDay).getSeconds()
        const minute = new Date(blockDay).getMinutes()
        const hour = new Date(blockDay).getHours()
        const date = new Date(blockDay).getDate()
        const month = new Date(blockDay).toLocaleString('default', { month: 'short' })

        await accountBlockCron(second, minute, hour, date, month, user._id)

        const setLimit = await MainUser.findOneAndUpdate(
            { _id: user._id },
            {
                block_duration: blockDay,
                status: "block"
            },
            { new: true, upsert: true }
        )
        if (setLimit) {
            res.status(200).json({ msg: "success", data: setLimit })
        }
    } catch (error) {
        console.error({
            title: "setCODLimit",
            message: error.message,
            time: new Date(),
            file: __filename,
            params: { data },
        });
    }

}