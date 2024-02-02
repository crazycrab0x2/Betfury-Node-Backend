const routerx = require("express-promise-router")
const configController = require("../controller/configController")
const tokenMiddleware = require("../middleware/token")

const Router = routerx()

// Get Site Config
Router.get("/getRequestLog", configController.getRequestLog)
Router.get("/getAllConfig", configController.getAllConfig)
Router.get("/getPlayerBaseData", configController.getPlayerBaseData)
Router.get("/getPlayerContentData", configController.getPlayerContentData)

// HomePage Content in Dashboard
Router.post("/getHomePageContentData", configController.getHomePageContentData)

// Home page Game list in dashboard
Router.post("/getHomePageGameData", configController.getHomePageGameData)


// getPokerSliderList in Poker Dashboard
Router.post("/getPokerSliderList", configController.getPokerSliderList)

// Support Data in Support Page
Router.post("/getSupportTypes", configController.getSupportTypes)
Router.post("/getSupportData", configController.getSupportData)

//  ------------------------------------------------------------------

// Notification Management Part
Router.post("/getMyNotification", tokenMiddleware.check_token, configController.getMyNotification)
Router.post("/readAllNotification", tokenMiddleware.check_token, configController.readAllNotification)

//  ------------------------------------------------------------------

// Promotion Page
Router.post("/getFundistBonusStatus", tokenMiddleware.check_token, configController.getFundistBonusStatus)
Router.post("/getPromoItemList", configController.getPromoItemList)
Router.post("/getBonusList", configController.getBonusList)
Router.post("/selectDepositBonus", tokenMiddleware.check_token, configController.selectDepositBonus)
Router.post("/cancelBonus", tokenMiddleware.check_token, configController.cancelBonus)

//  ------------------------------------------------------------------

// Multi Language
Router.post("/getMultilang", configController.getMultilang)

// Site Url Check (Activate accouont)
Router.post("/getUrlParseData", configController.getUrlParseData)
// this one is from admin
Router.post("/userActivateFromAdmin", configController.userActivateFromAdmin)


// Price List 
Router.post("/getPriceList", tokenMiddleware.check_token, configController.getPriceList)

// Show Our site Payment List to payment page
Router.post("/getAllGatewayListForPayment", configController.getAllGatewayListForPayment)

Router.get("/getPromotionTCList", configController.getPromotionTCList)

module.exports = Router
