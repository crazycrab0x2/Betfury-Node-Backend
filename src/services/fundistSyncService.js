const cron = require('node-cron');
const FundistService = require('./fundistService');
const { Tournaments } = require("../models/tournaments");
const { BonusList} = require('../models/vip');

const fundistService = FundistService.getInstance();

SYNC_PAST_TOURNAMENTS_SCHEDULE = '*/5 * * * *'
SYNC_BONUSES_SCHEDULE = '*/5 * * * *'

async function syncBonus(promotion) {
    let fundistBonus = null;
    [fundistBonus] = await fundistService.getBonusById(null, promotion.bonusId);
    return BonusList.findOneAndUpdate({ _id: promotion._id}, {
        results: fundistBonus.Results
    });
}

async function syncBonuses() {
    let promotions = [];

    try {
        promotions = await BonusList.find({ bonusId: { $ne: "1" }});
    } catch (e) {
        console.error('Fundist Sync: Error getting promotions from database.', e);
    }

    await Promise.allSettled(promotions.map((promotion) => syncBonus(promotion)))
        .then((results) => {
            const fulfilled = results.filter(({ status }) => status === 'fulfilled');
            const rejected = results.filter(({ status }) => status === 'rejected')
        })
}

async function syncTournament(tournamentStatus = '', tournament) {
    let leaderboard = await fundistService.getTournamentLeaderboard(tournament.ID);
    try {
        await Tournaments.findOneAndUpdate(
            { ID: tournament.ID },
            {
                ...tournament,
                Leaderboard: leaderboard,
                TournamentStatus: tournamentStatus,
            },
            {
                upsert: true,
                new: true
            });
    } catch (e) {
        console.error(e)
    }
}

async function syncTournaments() {
    let currentTournaments = [];
    let pastTournaments = [];

    try {
        currentTournaments = await fundistService.getTournaments(null, false);
    } catch (e) {
        console.error('Fundist Sync: Error getting current tournaments.', e);
    }

    try {
        pastTournaments = await fundistService.getPastTournamentsStats(10);
    } catch (e) {
        console.error('Fundist Sync: Error getting past tournaments from the database.', e)
    }

    await Promise.allSettled(currentTournaments.map((tournament) => syncTournament('current', tournament)))
        .then((results) => {
            const fulfilled = results.filter(({ status }) => status === 'fulfilled');
            const rejected = results.filter(({ status }) => status === 'rejected')
        })


    await Promise.allSettled(pastTournaments.map((tournament) => syncTournament('past', tournament)))
        .then((results) => {
            const fulfilled = results.filter(({ status }) => status === 'fulfilled');
            const rejected = results.filter(({ status }) => status === 'rejected')
        })
}

function start() {
    syncTournaments().then(() =>
        cron.schedule(SYNC_PAST_TOURNAMENTS_SCHEDULE, syncTournaments, {
            scheduled: true
        })
    );
    syncBonuses().then(() =>
        cron.schedule(SYNC_BONUSES_SCHEDULE, syncBonuses, {
            scheduled: true
        })
    );
}

module.exports = start;