const routerx = require("express-promise-router")
const walletController = require("../controller/walletController")
const tokenMiddleware = require("../middleware/token")

const Router = routerx()

//nowpayment - deposit request
Router.post("/getAvailableCurrencies", tokenMiddleware.check_token,  walletController.getAvailableCurrencies)
Router.post("/getMinimumDepositAmount", tokenMiddleware.check_token, walletController.getMinimumDepositAmount)
Router.post("/getMinimumWithdrawAmount", tokenMiddleware.check_token, walletController.getMinimumWithdrawAmount)
Router.post("/deposit", tokenMiddleware.check_token, walletController.deposit)
Router.post("/nowpaymentCallback", walletController.nowpaymentCallback)
Router.post("/withdraw", tokenMiddleware.check_token,  walletController.withdraw)
Router.post("/getTransactionHistory", tokenMiddleware.check_token,  walletController.getTransactionHistory)


Router.post("/getTransactionHistory", tokenMiddleware.check_token, walletController.getTransactionHistory)

//  ------------------------------------------------------------------

// Get Saved Card Info
Router.post("/getCardData", tokenMiddleware.check_token, walletController.getCardData)

// Player Transaction Excute
Router.post("/bankWithdraw", tokenMiddleware.check_token, walletController.bankWithdraw)
Router.post("/getPraxisUrl", tokenMiddleware.check_token, walletController.getPraxisUrl)

module.exports = Router
