const routerx = require("express-promise-router");
const authController = require("../controller/authController");
const tokenMiddleware = require("../middleware/token");

const Router = routerx();

// Authentication Part
Router.post(
  "/sessionCheck",
  tokenMiddleware.check_token,
  authController.sessionCheck
);
Router.post("/userLogin", authController.userLogin);
Router.post("/userRegister", authController.userRegister);
Router.post(
  "/userLogout",
  tokenMiddleware.check_token,
  authController.userLogout
);

module.exports = Router;
