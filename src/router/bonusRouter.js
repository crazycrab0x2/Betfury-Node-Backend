const routerx = require("express-promise-router");

const bonusController = require("../controller/bonusController");
const gameController = require("../controller/gameControllerNew");
const tokenMiddleware = require("../middleware/token");
const cashbackController = require("../controller/cashbackController");

const Router = routerx();

Router.post(
  "/getBonusHistory",
  tokenMiddleware.check_token,
  bonusController.getBonusHistory
);
Router.post(
  "/getFsHistory",
  tokenMiddleware.check_token,
  gameController.getFreeSpinsHistory
);
Router.post(
  "/bonusCheck",
  tokenMiddleware.check_token,
  bonusController.userBonusCheck
);

Router.get(
  "/cashbackHistory",
  tokenMiddleware.check_token,
  cashbackController.getCashbackHistory
)

Router.post(
  "/cashbackClaim",
  tokenMiddleware.check_token,
  cashbackController.isClaimed
)

module.exports = Router;
