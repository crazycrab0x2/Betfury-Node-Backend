const routerx = require("express-promise-router")
const integrationCGController = require("../controller/integrationCGController")
const tokenMiddleware = require("../middleware/token")

const Router = routerx()

// Authentication Part
Router.post("/authenticate", integrationCGController.authenticate)
Router.post("/balance", integrationCGController.balance)
Router.post("/changebalance", integrationCGController.changeBalance)
Router.post("/status", integrationCGController.status)
Router.post("/cancel", integrationCGController.cancel)

module.exports = Router