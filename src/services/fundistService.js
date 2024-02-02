const ProConf = require('../config/provider');
const axios = require('axios');
const uuidv4 = require('uuid');
const CryptoJS = require('crypto-js')
const FormData = require('form-data');
const { GameLists } = require("../models/game");
const md5 = require('md5');
const proConf = require('../config/provider');
const serverConf = require('../../serverConf');
const cron = require('node-cron');
const { Tournaments } = require("../models");
const { hideUsername } = require("../helpers");

class FundistService {

    static buildWLCHash(TID, user) {
        const hashString = 'WLCInfo/'
            + proConf.SOFTGAM.IP // [CASINO_SERVER_IP]
            + `/${TID}` // [TID]
            + `/${proConf.SOFTGAM.APIKEY}` // [KEY]
            + `/${serverConf.prefix}_${user.nickname}_${user.dis_currency}` //[LOGIN]
            + `/${proConf.SOFTGAM.APIPASS}`; // [PWD]

        return md5(hashString);
    }

    static _instance = null;

    _loyaltyInstance = null;
    _apiInstance = null;

    static getInstance() {
        if (FundistService._instance === null) {
            FundistService._instance = new FundistService();
        }

        return FundistService._instance;
    }

    /**
     * Singleton
     *
     * To get new instance use FundistService.getInstance();
     */
    constructor() {
        if (FundistService._instance) {
            throw new Error('Instance already exists - please user FundistService.getInstance()')
        }

        this._loyaltyInstance = axios.create({
            baseURL: `${ProConf.SOFTGAM.BonusEndpoint}/${ProConf.SOFTGAM.APIKEY}/`,
        });

        this._apiInstance = axios.create({
            baseURL: `${ProConf.SOFTGAM.ENDPOINT}/System/Api/${ProConf.SOFTGAM.APIKEY}/`
        })

        FundistService._instance = this;
    }

    async getUserLoyalty(user) {
        try {
            const { data } = await this._requestLoyalty('/Loyalty/Get', {
                Login: `${serverConf.prefix}_${user.nickname}_${user.dis_currency}` })
            return data
        } catch (e) {
            return null
        }
    }


    async getTournaments(IDUser, isActual) {
        const now = new Date();

        try {
            const { data } = await this._requestLoyalty('/Tournaments/Get', {
                ...(IDUser ? { IDUser } : {}),
            });

            if (data.error) {
                throw new Error("Can't get tournament progression from the system. Try again later.");
            }

            if (isActual === true) {
                return data.filter((item) => now > this._currentTimeFormatter(item.Starts, false)).slice(0, 1);
            } else {
                return data.sort((a, b) => new Date(a.Starts) - new Date(b.Starts));
            }
        } catch (e) {
            throw new Error("Can't get tournaments from the system. Try again later.");
        }
    }

    async getTournamentById(ID, IDUser) {
        try {
            const result = await this._requestLoyalty('/Tournaments/Get', {
                ID, ...IDUser ? { IDUser } : {}
            });
            if (result.data.error) {
                throw new Error('Can\'t get tournament progression from the system. Try again later.')
            }
            return result.data;
        } catch (e) {
            throw new Error('Can\'t get tournament progression from the system. Try again later.')
        }
    }

    async getTournamentByBonusId(BonusId) {
        try {
            if (!BonusId) {
                return null;
            }

            return await Tournaments.findOne({ WinningBonusesID: BonusId.toString() });
        } catch (e) {
            return [];
        }
    }

    async selectTournament(isSubscribe, IDUser, IDTournament, Balance) {
        try {
            const { data } = await this._requestLoyalty('/Tournaments/Select', {
                IDUser,
                IDTournament,
                Status: isSubscribe === true ? 1 : 0,
                Balance: isSubscribe === true ? Balance : 0
            });

            if (data.error) {
                throw new Error("Can't subscribe to the tournament. Try again later.");
            }

            return data;
        } catch (e) {
            throw new Error("Can't subscribe to the tournament. Try again later.");
        }
    }

    async getUserTournamentProgression(IDUser, IDTournament) {
        try {
            const { data } = await this._requestLoyalty('/Tournaments/Widgets/Top', {
                IDUser,
                IDTournament,
            });

            return data.user;
        } catch (e) {
            throw new Error('Can\'t get current tournament from the system. Try again later.');
        }
    }

    async getTournamentLeaderBoard(IDTournament, offset, limit) {
        try {
            const { data } = await this._requestLoyalty('/Tournaments/Widgets/Top', {
                IDTournament,
                Limit: 5000
            });

            if (data.error) {
                throw new Error('Can\'t get tournament leaderboard from the system. Try again later.');
            }

            return data.results;
        } catch (e) {
            throw new Error('Can\'t get tournament leaderboard from the system. Try again later.');
        }
    }

    async getTournamentGames(gameOptions) {
        try {
            const categories = gameOptions.Categories.map(id => id.toString());
            const providers = gameOptions.Merchants.map(id => id.toString());
            const games = gameOptions.Games.map(id => id.toString());
            const rules = [];

            if (categories.length > 0) {
                rules.push({ 'detail.Categories': { '$in': categories } })
            }
            if (providers.length > 0) {
                rules.push({ 'detail.system': { '$in': providers } })
            }
            if (games.length > 0) {
                rules.push({ 'gameId': { '$in': games } })
            }

            return await GameLists.find(rules.length > 0 ? { $and: rules } : {}).skip(0).limit(12)
        } catch (e) {
            throw new Error('Can\'t get tournament games from the system. Try again later.');
        }
    }

    async getPastTournaments(userId) {
        try {
            const now = new Date();
            const tournaments = await Tournaments
                .find({ TournamentStatus: "past" })
                .elemMatch("Leaderboard", { "IDUser": userId.toString()});

            const closestTournaments = tournaments.filter((tournament) => {
                const tournamentEnds = this._currentTimeFormatter(tournament.Ends, false);
                return tournamentEnds <= now;
            });

            closestTournaments.sort((a, b) => {
                const aEnds = this._currentTimeFormatter(a.Ends, false);
                const bEnds = this._currentTimeFormatter(b.Ends, false);
                return Math.abs(aEnds - now) - Math.abs(bEnds - now);
            });

            return closestTournaments.slice(0, 10);
        } catch (error) {
            throw new Error("Can't get tournament stats from the system. Try again later.");
        }
    }

    async getTournamentStats(IDTournament) {
        try {
            const data = await Tournaments.findOne({ ID: IDTournament })
            return data
        } catch (e) {
        }
    }

    async getPastTournamentsStats(limit) {
        try {
            const { data } = await this._requestLoyalty('/Tournaments/Stats', {
                Period: 'past',
                Limit: 5000,
                LimitTotal: 5000,
            });

            const tournaments = data.map((tournament) => {
                return ({
                    ...tournament,
                    ID: tournament.IDTournament,
                    Name: {
                        en: tournament.Name
                    },
                    WinningSpread: JSON.parse(tournament.WinningSpread),
                    FeeAmount: JSON.parse(tournament.FeeAmount),
                    Image: JSON.parse(tournament.Image).Image,
                    Terms: JSON.parse(tournament.Terms),
                    Description: JSON.parse(tournament.Description),
                    ...(tournament.WinningBonusesID ? { WinningBonusesID: JSON.parse(tournament.WinningBonusesID) } : {})
                })
            })

            const sortedTournaments = tournaments.sort((a, b) => {
                return a.Ends > b.Ends ? -1 : 1;
            });

            return sortedTournaments.slice(0, limit);
        } catch (e) {
            console.error('Error getting past tournaments from fundist.', e)
            return [];
        }
    }

    async getTournamentLeaderboard(IDTournament) {
        try {
            const { data: players } = await this._requestLoyalty('/Tournaments/Stats', {
                IDTournament,
            });

            const activePlayers = players.filter(player => parseInt(player.Status) > 0);
            const anonymizedPlayers = activePlayers.map((player) => ({
                    ...player,
                    Login: hideUsername(player.Login.split('_')[2])
                }
            ))
            const widgetPlayers = await Promise.all(anonymizedPlayers.map(async (player) => {
                return {
                    "IDUserPlace" : player.Place,
                    "IDUser" : player.IDUser,
                    "Win" : player.Win,
                    "BestWinToBetRatio" : player.BestWinToBetRatio,
                    "Points" : player.Points,
                    "Type" : player.Type,
                    "Target" : player.Target,
                    "LimitValue" : player.LimitValue,
                    "Login" : player.Login,
                    "Currency" : player.Currency,
                    "PointsTotal" : player.PointsTotal,
                    "WinEUR" : player.WinEUR,
                }
            }));

            return widgetPlayers.sort((a, b) => parseInt(a.Place) - parseInt(b.Place));
        } catch (e) {
            return [];
        }
    }

    /************************************ Bonus **************************/

    async getTournamentUserBonuses(IDUser) {
        try {
            const result = await this._requestLoyalty('/Bonuses/Get', {
                IDUser,
                Event: 'tournament'
            });

            if (result.data.error) {
                throw new Error('Can\'t activate the bonus in the system. Try again later.')
            }

            return result.data
        } catch (e) {
            throw new Error('Can\'t activate the bonus in the system. Try again later.')
        }
    }

    async getBonusById(IDUSer, IDBonus) {
        try {
            const result = await this._requestLoyalty('/Bonuses/Get', {
                ...IDUSer ? { IDUSer } : {},
                IDBonus
            });

            if (result.data.error) {
                throw new Error('Can\'t get bonus information from the system. Try again later.')
            }

            return result.data
        } catch (e) {
            throw new Error('Can\'t get bonus information from the system. Try again later.')
        }
    }

    async selectBonus(ip, user, IDBonus) {
        try {
            const TID = uuidv4.v4()
            const hash = FundistService.buildWLCHash(TID, user);
            const params = {
                IDBonus,
                Status: 1,
                Login: `${serverConf.prefix}_${user.nickname}_${user.dis_currency}`,
                TID,
                Hash: hash,
                UserIP: ip
            }

            const paramsString = new URLSearchParams(params);
            return await this._apiInstance('/WLCInfo/Bonus/Select?&' + paramsString.toString(), {});
        } catch (e) {
            throw new Error('Can\'t get user bonuses from the system. Try again later.')
        }
    }

    async cancelBonus(ip, user, IDBonus) {
        try {
            const TID = uuidv4.v4()
            const hash = FundistService.buildWLCHash(TID, user);
            const params = {
                IDBonus,
                Status: 0,
                Login: `${serverConf.prefix}_${user.nickname}_${user.dis_currency}`,
                TID,
                Hash: hash,
                UserIP: ip
            }

            const paramsString = new URLSearchParams(params);
            return await this._apiInstance('/WLCInfo/Bonus/Deselect?&' + paramsString.toString(), {});
        } catch (e) {
            throw new Error('Can\'t get user bonuses from the system. Try again later.')
        }
    }

    /************************************ Utils **************************/

    _buildParamsLoyalty(path, requestParams) {
        const TID = uuidv4.v4();

        const hashParams = { ...requestParams, TID }
        let paramHashString = ''
        const keys = Object.keys(hashParams).sort();
        for (const key of keys) {
            paramHashString += `/${key}=${hashParams[key]}`
        }
        let md5string = '';
        md5string += ProConf.SOFTGAM.APIKEY;
        md5string += path;
        md5string += paramHashString;
        md5string += `/${ProConf.SOFTGAM.APIPASS}`
        const hash = CryptoJS.MD5(md5string).toString();

        const payload = {
            ...hashParams,
            Hash: hash
        };

        const formData = new FormData();
        Object.keys(payload).sort().forEach(key => {
            formData.append(key, payload[key])
        });
        return formData;
    }

    _buildParamsApi(path) {
        let md5string = '';
        md5string += path;
        md5string += `/${ProConf.SOFTGAM.IP}`;
        md5string += `/${TID}`;
        md5string += `/${ProConf.SOFTGAM.APIKEY}`;
        md5string += `/${ProConf.SOFTGAM.APIPASS}`
        const hash = CryptoJS.MD5(md5string).toString();

        const payload = {
            ...hashParams,
            Hash: hash
        };

        const formData = new FormData();
        Object.keys(payload).sort().forEach(key => {
            formData.append(key, payload[key])
        });
        return formData;
    }

    _requestLoyalty(path, payload) {
        const formData = this._buildParamsLoyalty(path, payload);

        return this._loyaltyInstance.request({
            headers: { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` },
            url: path,
            data: formData,
            method: 'POST'
        });
    }

    _requestApi(path, payload) {
        const formData = this._buildParamsApi(path, payload);

        return this._axiosNoLoyalty.request({
            headers: { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` },
            url: path,
            data: formData,
            method: 'POST'
        });
    }

    _currentTimeFormatter(date, toIsoString) {
        const currentDate = new Date(date + 'Z');
        if (toIsoString) {
            return currentDate.toISOString();
        } else {
            return currentDate;
        }
    }
}

module.exports = FundistService;