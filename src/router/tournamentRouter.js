const routerx = require("express-promise-router")
const tournamentController = require("../controller/tournamentController");
const tokenMiddleware = require('../middleware/token');

const Router = routerx();

Router.post('/getTournaments', tournamentController.getTournaments);

Router.post('/getUserTournaments', tournamentController.getUserTournaments);

Router.post('/getTournamentLeaderBoard', tournamentController.getTournamentLeaderboard);

Router.post('/getTournament', tournamentController.getTournamentById);

Router.post('/getTournamentByBonusId', tournamentController.getTournamentByBonusId);

Router.post('/subscribeToTournament', tournamentController.subscribeToTournament);

Router.post('/unsubscribeFromTournament', tournamentController.unsubscribeFromTournament);

Router.post('/getUserTournamentProgression', tournamentController.getUserTournamentProgression);

Router.post('/getTournamentGames', tournamentController.getTournamentGames);

Router.post('/getTournamentUserBonuses', tournamentController.getTournamentUserBonuses);

Router.post('/redeemTournamentBonus', tokenMiddleware.check_token, tournamentController.selectTournamentBonus);

Router.post('/getPastTournaments', tournamentController.getPastTournaments);

Router.post('/getTournamentStats', tournamentController.getTournamentStats);

module.exports = Router