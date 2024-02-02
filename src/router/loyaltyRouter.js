const routerx = require("express-promise-router")
const loyaltyController = require('../controller/loyaltyController');
const tokenMiddleware = require('../middleware/token');

const Router = routerx();

Router.post('/getBonusById', loyaltyController.getBonusById);
Router.get('/user', tokenMiddleware.check_token, loyaltyController.fetchUserLoyalty);

module.exports = Router;