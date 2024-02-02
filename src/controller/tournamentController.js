const FundistService = require("../services/fundistService");
const requestIp = require("request-ip");
const { isNumber } = require("util");

const service = FundistService.getInstance();

exports.getTournaments = async (req, res) => {
  try {
    const { isActual } = req.body;
    // const data = await service.getTournaments(null, isActual);
    // res.status(200).json(data);
    res.status(200).json([]);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getUserTournaments = async (req, res) => {
  try {
    const { userId, isActual } = req.body;
    const data = await service.getTournaments(userId, isActual);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.subscribeToTournament = async (req, res) => {
  try {
    const { IDUser, IDTournament, Balance } = req.body;
    const data = await service.selectTournament(
      true,
      IDUser,
      IDTournament,
      Balance
    );
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.unsubscribeFromTournament = async (req, res) => {
  try {
    const { IDUser, IDTournament } = req.body;
    const data = await service.selectTournament(false, IDUser, IDTournament);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getUserTournamentProgression = async (req, res) => {
  try {
    const { userId, tournamentId } = req.body;
    const data = await service.getUserTournamentProgression(
      userId,
      tournamentId
    );
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getTournamentLeaderboard = async (req, res) => {
  try {
    const { IDTournament, offset, limit } = req.body;
    const data = await service.getTournamentLeaderboard(IDTournament);
    res.status(200).json({
      results:
        isNumber(offset) && isNumber(limit) ? data.slice(offset, limit) : data,
      totalCount: data.length,
    });
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getTournamentById = async (req, res) => {
  try {
    const { ID, IDUser } = req.body;
    const [tournament] = await service.getTournamentById(ID, IDUser);
    res.status(200).json(tournament);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getTournamentByBonusId = async (req, res) => {
  try {
    const { bonusId } = req.body;
    const tournament = await service.getTournamentByBonusId(bonusId);
    res.status(200).json(tournament);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getTournamentGames = async (req, res) => {
  try {
    const { gameOptions } = req.body;
    const data = await service.getTournamentGames(gameOptions);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getTournamentUserBonuses = async (req, res) => {
  try {
    const { IDUser } = req.body;
    const data = await service.getTournamentUserBonuses(IDUser);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.selectTournamentBonus = async (req, res) => {
  try {
    const { IDBonus } = req.body;
    const ip = requestIp.getClientIp(req);
    const response = await service.selectBonus(ip, req.user, IDBonus);
    res.status(200).json(response.data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getPastTournaments = async (req, res) => {
  try {
    const { userId } = req.body;
    const data = await service.getPastTournaments(userId);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.getTournamentStats = async (req, res) => {
  try {
    const { tournamentId, limit, offset } = req.body;
    const data = await service.getTournamentStats(tournamentId, limit, offset);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};
