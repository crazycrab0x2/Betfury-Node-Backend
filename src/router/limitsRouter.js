const routerx = require("express-promise-router")

const limitController = require("../controller/limitController")
const tokenMiddleware = require("../middleware/token")

const Router = routerx()

Router.get(
  "/getCODList",
  limitController.getCODlist
)

Router.post(
  "/setCODLimit",
  tokenMiddleware.check_token,
  limitController.setCODLimit
)

module.exports = Router
