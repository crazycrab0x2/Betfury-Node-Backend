const routerx = require("express-promise-router")
const promoController = require("../controller/promoController")

const Router = routerx()

// Get Game Provider Information
Router.post("/getLandingImage", promoController.getLandingImage)

module.exports = Router
