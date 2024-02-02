const routerx = require("express-promise-router")
const sportController = require("../controller/sportController")

const Router = routerx()

// Get Game Provider Information
Router.post("/getBetSlipData", sportController.getBetSlipData)

module.exports = Router
