const mongoose = require('mongoose')
const configController = require("../controller/configController")
const { UserSession, MainUser } = require("../models")
const mainConfig = require("../config")
const serverConfig = require("../../serverConf")
const fs = require('fs')

module.exports = async (io) => {
	


	io.on("connection", async (socket) => {
		console.log("Socket connected!", socket.id)

		// if (socket.handshake.query && socket.handshake.query.token) {
		// 	await UserSession.findOneAndUpdate({ token: socket.handshake.query.token }, { socketid: socket.id })
		// }

		socket.on("getbalance", async (data) => {
			const token = data.token
			console.log(data, "token====>")
			const player = await UserSession.findOne({ token })
			if (player) {
				const user = await MainUser.findOne({ id: player.id })
				if (serverConfig.site == "test-europa777.com" || serverConfig.site == "slotmaniax") {
					// const notifyCount = await configController.getMyNotificationCount(player.id)
					socket.emit("balance", {
						balance: user.balance,
						lock_balance: user.lock_balance,
						bonus_balance: user.bonus_balance,
						activated: user.activated,
						notifyCount
					})
				} else {
					socket.emit("balance", {SOL: 200})
				}
			} else {
				socket.emit("expire")
			}
		})

	})


}
