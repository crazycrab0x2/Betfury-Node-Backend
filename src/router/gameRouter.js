const routerx = require("express-promise-router")
const gameController = require("../controller/gameController")
const gameControllerNew = require("../controller/gameControllerNew")
const tokenMiddleware = require("../middleware/token")

const Router = routerx()

//free spin
Router.post("/freespin", tokenMiddleware.add_token, gameControllerNew.freespin)

// Get Game Provider Information
Router.post("/getProviders", tokenMiddleware.add_token, gameControllerNew.getProviders)

//  ------------------------------------------------------------------

// Game Relate Part
Router.post("/getGames", tokenMiddleware.add_token, gameControllerNew.getGames)
Router.post("/getGamesBySlug", tokenMiddleware.add_token, gameControllerNew.getGamesBySlug)
Router.post("/openDemoGame", gameControllerNew.openDemoGame)
Router.post("/openGame", tokenMiddleware.check_token, gameControllerNew.openGame)
Router.post("/openSportsGame", tokenMiddleware.add_token, gameControllerNew.openSportsGame)

//  ------------------------------------------------------------------

// Game Bet History Part
Router.post("/getProviderList", tokenMiddleware.check_token, gameControllerNew.getProviderList)
Router.post("/getGameHistory", tokenMiddleware.check_token, gameControllerNew.getGameHistory)
Router.post("/getSportHistory", tokenMiddleware.check_token, gameControllerNew.getSportHistory)
Router.post("/getBonusGameHistory", tokenMiddleware.check_token, gameControllerNew.getBonusGameHistory)

module.exports = Router
