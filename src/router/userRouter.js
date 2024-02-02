const routerx = require("express-promise-router")
const multer = require("multer")
const userController = require("../controller/userController")
const tokenMiddleware = require("../middleware/token")
const serverConfig = require('../../serverConf')

const Router = routerx()

// Player Update Data
Router.post("/changePassword", tokenMiddleware.check_token, userController.changePassword)
Router.post("/changeEmail", tokenMiddleware.check_token, userController.changeEmail)
Router.post("/changeUsername", tokenMiddleware.check_token, userController.changeUsername)
Router.post("/changeAvatar", tokenMiddleware.check_token, userController.changeAvatar)

// Verification Manage Part
Router.post("/updateKycData", tokenMiddleware.check_token,
    multer({ dest: serverConfig.BASEURL + "image/site/kycData/", limits: { fileSize: 1024 * 1024 * 10 } }).any(),
    userController.updateKycData
)
Router.post("/removeKycData", tokenMiddleware.check_token, userController.removeKycData)

//  ------------------------------------------------------------------

// Password Update, Session History
Router.post("/getSessionHistory", tokenMiddleware.check_token, userController.getSessionHistory)

//  ------------------------------------------------------------------

// Nickname Update Function
Router.post("/updateNickName", tokenMiddleware.check_token, userController.updateNickName)

// Update Language
Router.post("/updateLanguage", tokenMiddleware.check_token, userController.updateLanguage)

// Privacy Policy Page
Router.post("/sendNotificationSetting", tokenMiddleware.check_token, userController.sendNotificationSetting)
Router.post("/sendVerifyEmailRequest", tokenMiddleware.check_token, userController.sendVerifyEmailRequest)
Router.post("/sendVerifySMSRequest", tokenMiddleware.check_token, userController.sendVerifySMSRequest)
Router.post("/sendVerifyEmailCode", userController.sendVerifyEmailCode)
Router.post("/sendVerifySMSCode", userController.sendVerifySMSCode)

//  ------------------------------------------------------------------

// Forgot Password Request
Router.post("/forgotPasswordRequest", userController.forgotPasswordRequest)

// Resent Account Activation
Router.post("/resendAccountActivateEmail", tokenMiddleware.check_token, userController.resendAccountActivateEmail)

// Player Currency Update
Router.post("/updatePlayerCurrency", tokenMiddleware.check_token, userController.updatePlayerCurrency)

// HideZero Option
Router.post("/updateHidezero", tokenMiddleware.check_token, userController.updateHidezero)

// Add Currency to User
Router.post("/addPlayerCurrency", tokenMiddleware.check_token, userController.addPlayerCurrency)

// Update Dis currency Of User
Router.post("/updateDisCurrency", tokenMiddleware.check_token, userController.updateDisCurrency)

module.exports = Router