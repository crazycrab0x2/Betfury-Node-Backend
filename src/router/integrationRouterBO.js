const routerx = require("express-promise-router")
const integrationBOController = require("../controller/integrationBOController")
const tokenMiddleware = require("../middleware/token")

const Router = routerx()

Router.get("/", integrationBOController.endpoint)
Router.get("/ry", integrationBOController.ryan)
module.exports = Router