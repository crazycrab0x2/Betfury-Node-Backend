const md5 = require("md5");
const axios = require("axios");
const mongoose = require("mongoose");
const requestIp = require("request-ip");
const jwtSign = require("jwt-encode");
const uuidv4 = require("uuid");
const baseController = require("./baseController");

const {
  GameLists,
  UserSession,
  AgentProvider,
  MainUser,
  BetHistory,
  GameProviders,
  CuracaoRake,
  CurrencyList,
  BonusHistory,
  SportsBetHistory,
} = require("../models");

const proConf = require("../config/provider");
const tblConfig = require("../config/tablemanage");
const serverConf = require("../../serverConf");

const currencyISO = {
  EUR: 978,
};

exports.getProviderListSubFunc = async (
  gameType = "",
  device,
  user = false
) => {
  const condition = {
    $and: [
      {
        status: true,
      },
    ],
  };
  const providerCondition = {
    $and: [
      {
        status: true,
      },
    ],
  };

  if (serverConf.SiteUrl == "https://8866casino.net") {
    providerCondition["$and"].push({
      $nor: [
        {
          Agregator: "ZEUS",
        },
      ],
    });
  } else if (serverConf.SiteUrl == "https://123street.co") {
    providerCondition["$and"].push({
      $nor: [
        {
          Agregator: "SOFTGAMING",
        },
      ],
    });
  }

  if (gameType)
    condition["$and"].push({ gameType: mongoose.Types.ObjectId(gameType) });
  if (device < 1250) {
    condition["$and"].push({ ismobile: true });
  } else {
    condition["$and"].push({ isdesktop: true });
  }

  const allowProviders = await GameProviders.find(providerCondition);

  if (user) {
    let agent = await MainUser.findOne({ _id: user.created });
    let agentProvider = await AgentProvider.findOne({ id: agent.id });
    let providerList = [];
    if (agentProvider && agentProvider.provider) {
      for (let i in agentProvider.provider) {
        if (
          agentProvider.provider[i] == true &&
          allowProviders.findIndex((item) => item._id == i) > -1
        ) {
          providerList.push(mongoose.Types.ObjectId(i));
        }
      }
    }
    condition["$and"].push({ provider: { $in: providerList } });
  } else {
    let providerList = [];
    for (let i in allowProviders) {
      providerList.push(allowProviders[i]._id);
    }
    condition["$and"].push({ provider: { $in: providerList } });
  }

  let data = await GameLists.aggregate([
    {
      $match: condition,
    },
    {
      $group: {
        _id: "$provider",
      },
    },
    {
      $lookup: {
        from: tblConfig.game_providers,
        localField: "_id",
        foreignField: "_id",
        as: "provider",
      },
    },
    {
      $unwind: "$provider",
    },
    {
      $sort: {
        "provider.providerOrder": 1,
      },
    },
    {
      $project: {
        image: "$provider.image",
        providerName: "$provider.providerName",
        currency: "$provider.currency",
        RTP: "$provider.RTP",
      },
    },
  ]);
  return data;
};

// Get Game Provider Information
exports.getProviders = async (req, res) => {
  try {
    const { gameType } = req.body;
    const data = await this.getProviderListSubFunc(
      gameType,
      req.headers.device,
      req.user
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getProviders",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// Get Top and New game list on Dashboard
exports.getTopSlotGames = async (count, device, user) => {
  let limit = 7;
  if (count) {
    limit = count;
  }

  const match = {
    $and: [
      {
        gameType: mongoose.Types.ObjectId("6011f42064c3343290b99fd5"),
      },
      {
        status: true,
      },
    ],
  };
  if (device < 1250) {
    match["$and"].push({ ismobile: true });
  } else {
    match["$and"].push({ isdesktop: true });
  }

  if (user) {
    let agent = await MainUser.findOne({ _id: user.created });
    let agentProvider = await AgentProvider.findOne({ id: agent.id });
    let providerList = [];
    if (agentProvider && agentProvider.provider) {
      for (let i in agentProvider.provider) {
        const oneProvider = await GameProviders.findOne({
          _id: mongoose.Types.ObjectId(i),
        });
        if (oneProvider.status && agentProvider.provider[i] == true) {
          providerList.push(mongoose.Types.ObjectId(i));
        }
      }
    }
    match["$and"].push({ provider: { $in: providerList } });
  }

  const providers = await GameProviders.find({ status: true });
  const proFilter = [];
  for (let i = 0; i < providers.length; i++) {
    proFilter.push(providers[i]._id);
  }
  match["$and"].push({ provider: { $in: proFilter } });

  const data = await GameLists.aggregate([
    {
      $match: match,
    },
    {
      $sort: {
        opens: -1,
      },
    },
    {
      $limit: limit,
    },
  ]);
  return data;
};

exports.getNewSlotGames = async (count, device, user) => {
  let limit = 7;
  if (count) {
    limit = count;
  }

  const match = {
    $and: [
      {
        gameType: mongoose.Types.ObjectId("6011f42064c3343290b99fd5"),
      },
      {
        isnew: true,
      },
      {
        status: true,
      },
    ],
  };
  if (device < 1250) {
    match["$and"].push({ ismobile: true });
  } else {
    match["$and"].push({ isdesktop: true });
  }

  if (user) {
    let agent = await MainUser.findOne({ _id: user.created });
    let agentProvider = await AgentProvider.findOne({ id: agent.id });
    let providerList = [];
    if (agentProvider && agentProvider.provider) {
      for (let i in agentProvider.provider) {
        const oneProvider = await GameProviders.findOne({
          _id: mongoose.Types.ObjectId(i),
        });
        if (oneProvider.status) {
          // if (agentProvider.provider[i] == true && oneProvider._doc.currency.findIndex(item => item == user.currency) > -1) {
          providerList.push(mongoose.Types.ObjectId(i));
        }
      }
    }
    match["$and"].push({ provider: { $in: providerList } });
  }

  const providers = await GameProviders.find({ status: true });
  const proFilter = [];
  for (let i = 0; i < providers.length; i++) {
    proFilter.push(providers[i]._id);
  }
  match["$and"].push({ provider: { $in: proFilter } });

  const data = await GameLists.aggregate([
    {
      $match: match,
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $limit: limit,
    },
  ]);
  return data;
};

//  ------------------------------------------------------------------

// Game Relate Part
exports.getGameChild = async (
  gameType,
  page,
  perPage,
  provider,
  gameName,
  device,
  user
) => {
  const condition = {
    $and: [
      {
        status: true,
      },
    ],
  };

  if (serverConf.SiteUrl == "https://8866casino.net") {
    condition["$and"].push({
      $nor: [
        {
          Agregator: "ZEUS",
        },
      ],
    });
  } else if (serverConf.SiteUrl == "https://123street.co") {
    condition["$and"].push({
      $nor: [
        {
          Agregator: "SOFTGAMING",
        },
      ],
    });
  }

  const providers = await GameProviders.find(condition);
  const proFilter = [];
  for (let i = 0; i < providers.length; i++) {
    proFilter.push(providers[i]._id);
  }

  const match = {
    $and: [
      {
        status: true,
      },
      {
        provider: {
          $in: proFilter,
        },
      },
    ],
  };

  if (gameType) {
    match["$and"].push({
      gameType: mongoose.Types.ObjectId(gameType),
    });
  }

  let order = {
    order: 1,
  };

  if (provider == "1") {
    match["$and"].push({ isnew: true });
  } else if (provider == "2") {
    match["$and"].push({ opens: { $gte: 0 } });
  } else if (provider != "0" && provider) {
    match["$and"].push({ provider: mongoose.Types.ObjectId(provider) });
  }
  if (gameName) {
    match["$and"].push({ gameName: { $regex: gameName, $options: "i" } });
  }

  if (device < 1250) {
    match["$and"].push({ ismobile: true });
  } else {
    match["$and"].push({ isdesktop: true });
  }

  if (provider == "1") {
    order = {
      _id: -1,
    };
  }

  if (user) {
    let agent = await MainUser.findOne({ _id: user.created });
    let agentProvider = await AgentProvider.findOne({ id: agent.id });
    let providerList = [];
    if (agentProvider && agentProvider.provider) {
      for (let i in agentProvider.provider) {
        // const oneProvider = await GameProviders.findOne({ _id: mongoose.Types.ObjectId(i) })
        if (agentProvider.provider[i] == true) {
          // if (agentProvider.provider[i] == true && oneProvider._doc.currency.findIndex(item => item == user.currency) > -1) {
          providerList.push(mongoose.Types.ObjectId(i));
        }
      }
    }
    match["$and"].push({ provider: { $in: providerList } });
  }

  const count = await GameLists.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ]);

  const data = await GameLists.aggregate([
    {
      $match: match,
    },
    {
      $sort: order,
    },
    {
      $skip: page * perPage,
    },
    {
      $limit: perPage,
    },
  ]);
  return { data, count };
};
exports.getGames = async (req, res) => {
  try {
    const { gameType, page, perPage, provider, gameName } = req.body;
    const { data, count } = await this.getGameChild(
      gameType,
      page,
      perPage,
      provider,
      gameName,
      req.headers.device,
      req.user
    );
    return res
      .status(200)
      .json({ data, count: count.length ? count[0].count : 0 });
  } catch (error) {
    console.error({
      title: "getGames",
      message: error.message,
      date: new Date(),
      error,
    });
    return res.status(500).send("Server Error");
  }
};

exports.getGamesById = async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await GameLists.find({ gameId: { $in: gameId } });
    res.status(200).json(game);
  } catch (error) {
    console.error({
      title: "getGameById",
      message: error.message,
      date: new Date(),
      error,
    });
    return res.status(500).send("Server Error");
  }
};

exports.openDemoGame = async (req, res) => {
  try {
    const game = req.body;

    const realIp = requestIp.getClientIp(req);
    const realCountry = await baseController.getUserCountry(realIp, "IT");

    if (game._id) {
      const historyData = {
        ip: realIp,
        country: realCountry,
        device: req.headers.device,
        locale: game.locale,
      };
      await GameLists.findOneAndUpdate(
        { _id: game._id },
        { $inc: { opens: 1 } }
      );
      const realGame = await GameLists.findOne({ _id: game._id });

      this.getDemoGameLaunchUrlOfGame(
        realGame,
        historyData,
        async (urlData, errMsg) => {
          if (urlData) {
            return res.status(200).send(urlData);
          } else {
            return res.status(400).send(errMsg);
          }
        }
      );
    } else {
      return res.status(400).send("Wrong Parameter");
    }
  } catch (error) {
    console.error({
      title: "openDemoGame",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getDemoGameLaunchUrlOfGame = async (realGame, historyData, cb) => {
  const { ip, device, country } = historyData;
  switch (realGame.LAUNCHURLID) {
    case 1:
      let TID = new Date().valueOf().toString();
      let Hash = md5(
        `User/AuthHTML/${proConf.SOFTGAM.IP}/${TID}/${
          proConf.SOFTGAM.APIKEY
        }/${"8866casino"}/${"8866casino"}/${realGame.detail.system}/${
          proConf.SOFTGAM.APIPASS
        }`
      );
      let PageCode = "";
      if (device < 1250) {
        PageCode = realGame.detail.MobilePageCode;
      } else {
        PageCode = realGame.detail.PageCode;
      }

      const url =
        `${proConf.SOFTGAM.ENDPOINT}System/Api/${proConf.SOFTGAM.APIKEY}/User/AuthHTML/?` +
        `&Login=${"8866casino"}&Password=${"8866casino"}&System=${
          realGame.detail.system
        }` +
        `&TID=${TID}&Hash=${Hash}&Page=${PageCode}&UserIP=${ip}&UserAutoCreate=1&Currency=EUR&` +
        `${
          realGame.detail.system == "992" || realGame.detail.system == "944"
            ? "UniversalLaunch=1"
            : ""
        }` +
        `&Country=${country}&Demo=1&IsMobile=${device < 1250 ? 1 : 0}`;

      const softGamLaunch = await baseController.axiosRequest(url, {}, "POST");

      if (softGamLaunch && softGamLaunch.toString().indexOf("1,") > -1) {
        cb(softGamLaunch.split("1,")[1]);
      } else {
        cb(false, softGamLaunch);
      }
      break;
    case 4:
      let tvurl = `${proConf.TVBET.gameUrl}/?lng=${historyData.locale}&clientId=${proConf.TVBET.clientID}&tagId=${realGame.detail.tagId}#/game_id/${realGame.detail.gameCode}`;
      cb({ url: tvurl });
      break;
    case 6:
      const playstarurl = `${proConf.PlayStar.Endpoint}/launch/?host_id=${proConf.PlayStar.HostId}&game_id=${realGame.gameId}&lang=en-US&return_url=${serverConf.SiteUrl}/lobby/index.htm`;
      cb({ url: playstarurl });
      break;
    case 7:
      const funtajwt = jwtSign(
        {
          client_id: proConf.Funta.ClientId,
          iat: new Date().valueOf(),
        },
        proConf.Funta.Secret
      );

      const config = {
        method: "post",
        url: `${proConf.Funta.Endpoint}/api/game/outside/demo/link`,
        data: {
          client_id: proConf.Funta.ClientId,
          game_id: realGame.gameId,
          currency: currencyISO["EUR"],
        },
        headers: {
          Authorization: `Bearer ${funtajwt}`,
        },
      };

      axios(config)
        .then(async (response) => {
          if (response.data.link) {
            cb({ url: response.data.link });
          } else {
            cb(false, "Provider Error");
          }
        })
        .catch(function (error) {
          cb(false, "Provider Error");
        });
      break;
    case 8:
      const sagamingConfig = {
        method: "post",
        url: proConf.Sagaming.url,
        data: {
          username: "demo",
          hostId: realGame.gameId,
          currency: "EUR",
          isForFun: true,
          isMobile: device < 1250,
        },
      };
      axios(sagamingConfig)
        .then(async (response) => {
          if (response.data.url) {
            cb({ url: response.data.url });
          } else {
            console.error("[SAGAMING] OpenDemoGame", response.data);
            cb(false, "Provider Error");
          }
        })
        .catch(function (error) {
          console.error("[SAGAMING] OpenDemoGame", error);
          cb(false, "Provider Error");
        });
      break;
    case 9:
      const sendData = {
        PartnerId: proConf.IQsoft.PartnerId,
        GameId: realGame.gameId,
        Token: "",
        IsForMobile: device < 768 ? true : false,
        LanguageId: "en",
      };

      const data = await baseController.axiosRequest(
        proConf.IQsoft.Url,
        sendData,
        "POST"
      );

      if (data) {
        if (data.ResponseObject) {
          cb({ url: data.ResponseObject });
        } else {
          cb(false, data.Description);
        }
      } else {
        cb(false, "Server Error");
      }
      break;
    default:
      cb(false, "Wrong Parameter");
      return;
  }
};

exports.openGame = async (req, res) => {
  try {
    const game = req.body;

    const realIp = requestIp.getClientIp(req);
    const realCountry = await baseController.getUserCountry(realIp, "IT");

    if (game._id) {
      const historyData = {
        ip: realIp,
        country: realCountry,
        device: req.headers.device,
        locale: game.locale,
      };

      let user = req.user;
      if (!user.nickname) {
        return res.status(400).send("Invalid Nickname");
      }

      await GameLists.findOneAndUpdate(
        { _id: game._id },
        { $inc: { opens: 1 } }
      );
      const realGame = await GameLists.findOne({ _id: game._id });
      const realProvider = await GameProviders.findOne({
        _id: realGame.provider,
      });
      const currencyItem = await CurrencyList.findOne({
        currency: user.dis_currency,
      });

      if (
        !realProvider.currency.includes(user.dis_currency) ||
        !currencyItem.disgame
      ) {
        return res
          .status(400)
          .send(`Your currency is not allowed on this game`);
      }

      this.getGameLaunchUrlOfGame(
        user,
        realGame,
        historyData,
        async (urlData, errMsg) => {
          if (urlData) {
            return res.status(200).send(urlData);
          } else {
            return res.status(400).send(errMsg);
          }
        }
      );
    } else {
      return res.status(400).send("Wrong Parameter");
    }
  } catch (error) {
    console.error({
      title: "openGame",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.openSportsGame = async (req, res) => {
  try {
    const user = req.user;
    const { hash } = req.body;

    let token = "token";
    if (user) {
      let tokenData = await UserSession.findOne({ id: user.id });
      token = tokenData._id;
    }
    const sendData = {
      PartnerId: proConf.IQsoft.PartnerId,
      GameId: proConf.IQsoft.SportsId,
      Token: user ? token : "",
      IsForMobile: req.headers.device < 768 ? true : false,
      LanguageId: proConf.IQsoft.SportsId == 6 ? "" : "en",
    };
    const data = await baseController.axiosRequest(
      proConf.IQsoft.Url,
      sendData,
      "POST"
    );
    if (data) {
      const resData = data.ResponseObject;
      let urlData;
      if (hash) {
        const hashurl = hash.indexOf("#") > -1 ? hash.split("#")[1] : hash;
        const url = hashurl.split("?")[0];
        const search = hashurl.split("?")[1];
        if (search) {
          urlData = resData.split("/?").join(`${url}?`) + `&${search}`;
        } else {
          urlData = resData.split("/?").join(`${url}?`);
        }
      } else {
        urlData = resData;
      }
      return res.status(200).json({ url: urlData });
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "openSportsGame",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getGameLaunchUrlOfGame = async (user, realGame, historyData, cb) => {
  try {
    const { ip, country, device } = historyData;
    const userSession = await UserSession.findOne({ id: user.id });
    switch (realGame.LAUNCHURLID) {
      case 1:
        let TID = new Date().valueOf().toString();
        let Hash = md5(
          `User/AuthHTML/${proConf.SOFTGAM.IP}/${TID}/${proConf.SOFTGAM.APIKEY}/${serverConf.prefix}_${user.nickname}_${user.dis_currency}/${user.nickname}/${realGame.detail.system}/${proConf.SOFTGAM.APIPASS}`
        );
        let PageCode = "";
        if (device < 1250) {
          PageCode = realGame.detail.MobilePageCode;
        } else {
          PageCode = realGame.detail.PageCode;
        }

        let softGamLaunch = "";
        if (
          realGame.detail.system == "992" ||
          realGame.detail.system == "944"
        ) {
          softGamLaunch = await baseController.axiosRequest(
            `${proConf.SOFTGAM.ENDPOINT}System/Api/${proConf.SOFTGAM.APIKEY}/User/AuthHTML/?` +
              `&Login=${serverConf.prefix}_${user.nickname}_${user.dis_currency}&Password=${user.nickname}&System=${realGame.detail.system}` +
              `&TID=${TID}&Hash=${Hash}&Page=${PageCode}&UserIP=${ip}&IsMobile=${
                device < 1250 ? 1 : 0
              }&UserAutoCreate=1&Currency=${
                user.dis_currency
              }&UniversalLaunch=1&Country=${country}`,
            {},
            "POST"
          );
        } else {
          softGamLaunch = await baseController.axiosRequest(
            `${proConf.SOFTGAM.ENDPOINT}System/Api/${proConf.SOFTGAM.APIKEY}/User/AuthHTML/?` +
              `&Login=${serverConf.prefix}_${user.nickname}_${user.dis_currency}&Password=${user.nickname}&System=${realGame.detail.system}` +
              `&TID=${TID}&Hash=${Hash}&Page=${PageCode}&UserIP=${ip}&IsMobile=${
                device < 1250 ? 1 : 0
              }&UserAutoCreate=1&Currency=${
                user.dis_currency
              }&Country=${country}`,
            {},
            "POST"
          );
        }

        if (softGamLaunch && softGamLaunch.toString().indexOf("1,") > -1) {
          cb(softGamLaunch.split("1,")[1]);
          if (
            serverConf.SiteUrl == "https://test108.com" ||
            serverConf.SiteUrl == "https://slotmaniax.com"
          ) {
            if (!user.softId) {
              // This is for update softId of user
              await baseController.axiosRequest(
                `${serverConf.apiUrl}/api/updateSoftgameData`,
                {},
                "POST"
              );
            }
          } else if (!user.activated) {
            // This case is for agent sites.
            // In case of agent site, we have to block all bonuses from agent's players
            const flag = await baseController.addBonusBlock(
              user.nickname,
              user.dis_currency
            );
            if (flag) {
              await MainUser.findOneAndUpdate(
                { _id: user._id },
                { activated: true }
              );
            }
          }
        } else {
          if (softGamLaunch) {
            cb(false, softGamLaunch);
          } else {
            cb(false, "Provider Error");
          }
        }
        break;
      case 2:
        let live168OpenData = {
          requestHeader: {
            principalUserId: proConf.LIVE168.principalUserId,
            principalPwd: proConf.LIVE168.principalPwd,
            service: "loginLobbyController",
          },
          requestBody: {
            userId: `${proConf.LIVE168.prefix}${serverConf.prefix}_${user.nickname}`,
            password: user.nickname,
            country,
            language: user.language || "it",
            currency: user.dis_currency,
          },
        };

        let live168GamLaunch = await baseController.axiosRequest(
          proConf.LIVE168.Endpoint,
          live168OpenData,
          "POST"
        );

        if (live168GamLaunch) {
          if (live168GamLaunch.done == "true") {
            let live168token = live168GamLaunch.response.token;
            let lobbyURL = live168GamLaunch.response.lobbyURL;
            await UserSession.findOneAndUpdate(
              { id: user.id },
              { gameToken: live168token }
            );
            let url = `${lobbyURL}?token=${live168token}&GAME_REQUESTED=${realGame.gameId}`;
            cb({ url });
          } else {
            cb(false, live168GamLaunch.medialiveMessage[0].description);
          }
        } else {
          cb(false, "Provider Error");
        }
        break;
      case 3:
        let pokerUrl = `https://games.${
          serverConf.sitename
        }/authorization.php?gameId=${realGame.gameId}&token=${
          userSession._id
        }&partnerId=${proConf.BETCONSTRUCTPOKER.partnerid}&language=${
          user.language || "it"
        }&openType=real&devicetypeid=1`;
        if (device < 1250) {
          pokerUrl += "&isMobile=true";
        }

        cb({ url: pokerUrl });
        break;
      case 4:
        const tvurl = `${proConf.TVBET.gameUrl}/?lng=${historyData.locale}&clientId=${proConf.TVBET.clientID}&token=${userSession._id}&tagId=${realGame.detail.tagId}#/game`;
        cb({ url: tvurl });
        break;
      case 5:
        let zeusProviderData = await GameProviders.findOne({
          _id: realGame.provider,
        });
        let zeusData;

        if (realGame.gameType == "603e6b45e10dfc1b1c7e548b") {
          zeusData = await baseController.axiosRequest(
            `${proConf.ZEUS.ENDPOINT}/open_session?token=${proConf.ZEUS.token}&` +
              `key=${proConf.ZEUS.key}&group_id=${proConf.ZEUS.groupid}&user_id=${user.nickname}&` +
              `software=${realGame.detail.gid}&game_id=0`,
            {},
            "POST"
          );
        } else {
          zeusData = await baseController.axiosRequest(
            `${proConf.ZEUS.ENDPOINT}/open_session?token=${proConf.ZEUS.token}&` +
              `key=${proConf.ZEUS.key}&group_id=${proConf.ZEUS.groupid}&user_id=${user.nickname}&` +
              `software=${zeusProviderData.providerName}&game_id=${realGame.detail.gid}`,
            {},
            "POST"
          );
        }

        if (zeusData && zeusData.err == "ok") {
          cb({ url: zeusData.game_link });
        } else {
          cb(false, zeusData.err);
        }
        break;
      case 6:
        const playstarurl =
          `${proConf.PlayStar.Endpoint}/launch/?host_id=${proConf.PlayStar.HostId}&game_id=${realGame.gameId}&lang=en-US` +
          `&access_token=${userSession._id}&return_url=${serverConf.SiteUrl}/lobby/index.htm`;
        cb({ url: playstarurl });
        break;
      case 7:
        const funtajwt = jwtSign(
          {
            client_id: proConf.Funta.ClientId,
            iat: new Date().valueOf(),
          },
          proConf.Funta.Secret
        );

        const config = {
          method: "post",
          url: `${proConf.Funta.Endpoint}/api/game/outside/link`,
          data: {
            client_id: proConf.Funta.ClientId,
            game_id: realGame.gameId,
            username: user.nickname,
            invite_code: proConf.Funta.agentCode,
            token: userSession._id,
            uid: user.id,
            currency: currencyISO[user.dis_currency],
          },
          headers: {
            Authorization: `Bearer ${funtajwt}`,
          },
        };

        axios(config)
          .then(async (response) => {
            if (response.data.link) {
              cb({ url: response.data.link });
            } else {
              cb(false, "Provider Error");
            }
          })
          .catch(function (error) {
            cb(false, "Provider Error");
          });
        break;
      case 8:
        const sagamingConfig = {
          method: "post",
          url: `${proConf.Sagaming.url}`,
          data: {
            username: user.nickname,
            hostId: realGame.gameId,
            currency: user.dis_currency,
            isForFun: false,
            isMobile: device < 1250,
          },
        };
        axios(sagamingConfig)
          .then(async (response) => {
            if (response.data.url) {
              cb({ url: response.data.url });
            } else {
              cb(false, "Provider Error");
            }
          })
          .catch(function (error) {
            cb(false, "Provider Error");
          });
        break;
      case 9:
        const iqtoken = uuidv4.v4();
        await UserSession.findOneAndUpdate(
          { id: user.id },
          { gameToken: iqtoken }
        );

        const sendData = {
          PartnerId: proConf.IQsoft.PartnerId,
          GameId: realGame.gameId,
          Token: iqtoken,
          IsForMobile: device < 768 ? true : false,
          LanguageId: user.language,
          CountryCode: user.country,
        };

        const data = await baseController.axiosRequest(
          proConf.IQsoft.Url,
          sendData,
          "POST"
        );

        if (data) {
          if (data.ResponseObject) {
            cb({ url: data.ResponseObject });
          } else {
            cb(false, data.Description);
          }
        } else {
          cb(false, "Server Error");
        }
        break;
      default:
        cb(false, "Wrong Parameter");
        return;
    }
  } catch (error) {
    cb(false, "Server Error");
  }
};

//  ------------------------------------------------------------------

// Game Bet History Part
exports.getGameHistory = async (req, res) => {
  try {
    let { parsedFilter, condition } = req.body;

    if (
      new Date(condition.date[1]).valueOf() -
        new Date(condition.date[0]).valueOf() >=
      1000 * 3600 * 24 * 62
    ) {
      return res.status(500).send("Please select duration below 2 months");
    }

    let newCondition = await this.getSearchDataOfTR(condition, req.user);
    let totalDWData = await this.getTotalDataOfTR(
      newCondition,
      condition,
      req.user
    );
    let count = await BetHistory.countDocuments(newCondition);
    let pages = await baseController.setPage(parsedFilter, count);

    let data = await BetHistory.aggregate([
      {
        $match: newCondition,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: pages.limit,
      },
      {
        $skip: pages.skip,
      },
      {
        $lookup: {
          from: tblConfig.users,
          localField: "USERID",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: "$user.username",
          game: "$GAMEID",
          LAUNCHURL: "$LAUNCHURL",
          amount: "$AMOUNT",
          type: "$TYPE",
          transactionId: "$transactionId",
          lastbalance: "$lastbalance",
          updatedbalance: "$updatedbalance",
          currency: "$currency",
          createdAt: "$createdAt",
        },
      },
    ]);

    pages["skip1"] = data.length ? pages.skip + 1 : 0;
    pages["skip2"] = pages.skip + data.length;
    return res.status(200).json({ data, totalCount: count, totalDWData });
  } catch (error) {
    console.error({
      title: "getGameHistory",
      error,
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getSportHistory = async (req, res) => {
  try {
    let { parsedFilter, condition } = req.body;

    if (
      new Date(condition.date[1]).valueOf() -
        new Date(condition.date[0]).valueOf() >=
      1000 * 3600 * 24 * 62
    ) {
      return res.status(500).send("Please select duration below 2 months");
    }

    let newCondition = await this.getSearchDataOfSportTR(condition, req.user);
    let totalDWData = await this.getTotalDataOfSportTR(newCondition);
    let count = await SportsBetHistory.countDocuments(newCondition);
    let pages = await baseController.setPage(parsedFilter, count);

    let data = await SportsBetHistory.aggregate([
      {
        $match: newCondition,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: pages.limit,
      },
      {
        $skip: pages.skip,
      },
      {
        $project: {
          type: "$TYPE",
          transactionId: "$transactionId",
          lastbalance: "$lastbalance",
          updatedbalance: "$updatedbalance",
          currency: "$currency",
          IsLive: "$detail.IsLive",
          TypeId: "$detail.TypeId",
          State: "$detail.State",
          BetAmount: "$detail.BetAmount",
          WinAmount: "$detail.WinAmount",
          BetDate: "$createdAt",
          Coefficient: "$detail.Coefficient",
          matchs: "$detail.selectData",
        },
      },
    ]);

    for (let i = 0; i < data.length; i++) {
      data[i].matchs = data[i].matchs.length;
    }

    pages["skip1"] = data.length ? pages.skip + 1 : 0;
    pages["skip2"] = pages.skip + data.length;
    return res
      .status(200)
      .json({ data, totalCount: count, totalDWData: totalDWData });
  } catch (error) {
    console.error({
      title: "getSportHistory",
      error,
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getBonusGameHistory = async (req, res) => {
  try {
    let { parsedFilter, condition } = req.body;

    if (
      new Date(condition.date[1]).valueOf() -
        new Date(condition.date[0]).valueOf() >=
      1000 * 3600 * 24 * 62
    ) {
      return res.status(500).send("Please select duration below 2 months");
    }

    let newCondition = await this.getSearchDataOfTR(condition, req.user);
    let totalDWData = await this.getTotalDataOfBTR(
      newCondition,
      condition,
      req.user
    );
    let count = await BonusHistory.countDocuments(newCondition);
    let pages = await baseController.setPage(parsedFilter, count);

    let data = await BonusHistory.aggregate([
      {
        $match: newCondition,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: pages.limit,
      },
      {
        $skip: pages.skip,
      },
      {
        $lookup: {
          from: tblConfig.users,
          localField: "USERID",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: "$user.username",
          game: "$GAMEID",
          LAUNCHURL: "$LAUNCHURL",
          amount: "$AMOUNT",
          type: "$TYPE",
          transactionId: "$transactionId",
          lastbalance: "$lastbalance",
          updatedbalance: "$updatedbalance",
          currency: "$currency",
          createdAt: "$createdAt",
        },
      },
    ]);

    pages["skip1"] = data.length ? pages.skip + 1 : 0;
    pages["skip2"] = pages.skip + data.length;
    return res.status(200).json({ data, totalCount: count, totalDWData });
  } catch (error) {
    console.error({
      title: "getBonusGameHistory",
      error,
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getSearchDataOfTR = async (condition, user) => {
  let start = await baseController.get_stand_date_end(condition.date[0]);
  let end = await baseController.get_stand_date_end(condition.date[1]);

  let newCondition = {
    $and: [
      { createdAt: { $gte: start, $lte: end } },
      { USERID: mongoose.Types.ObjectId(user.id) },
    ],
  };

  if (condition.currency)
    newCondition["$and"].push({ currency: condition.currency });
  if (condition.type) newCondition["$and"].push({ TYPE: condition.type });
  if (condition.tid)
    newCondition["$and"].push({
      transactionId: { $regex: condition.tid, $options: "i" },
    });

  if (condition.provider) {
    if (mongoose.Types.ObjectId.isValid(condition.provider)) {
      const games = await GameLists.find({ provider: condition.provider });
      const gameList = [];
      for (let i = 0; i < games.length; i++) {
        gameList.push(games[i].gameId);
      }
      newCondition["$and"].push({ GAMEID: { $in: gameList } });
    } else {
      newCondition["$and"].push({
        GAMEID: condition.provider === "892" ? "421" : condition.provider,
      });
    }
  }

  return newCondition;
};

exports.getTotalDataOfSportTR = async (condition) => {
  let totalData = await SportsBetHistory.aggregate([
    {
      $match: condition,
    },
    {
      $group: {
        _id: "$currency",
        betamount: {
          $sum: "$detail.BetAmount",
        },
        winamount: {
          $sum: "$detail.WinAmount",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return totalData;
};

exports.getSearchDataOfSportTR = async (condition, user) => {
  let start = await baseController.get_stand_date_end(condition.date[0]);
  let end = await baseController.get_stand_date_end(condition.date[1]);

  let newCondition = {
    $and: [
      { createdAt: { $gte: start, $lte: end } },
      { USERID: mongoose.Types.ObjectId(user.id) },
    ],
  };

  if (condition.tid)
    newCondition["$and"].push({
      transactionId: { $regex: condition.tid, $options: "i" },
    });
  if (condition.State)
    newCondition["$and"].push({ "detail.State": condition.State });
  if (condition.IsLive)
    newCondition["$and"].push({
      "detail.IsLive": condition.IsLive === "true" ? true : false,
    });

  return newCondition;
};

exports.getTotalDataOfTR = async (newCondition, condition, user) => {
  let totalData = await BetHistory.aggregate([
    {
      $match: newCondition,
    },
    {
      $group: {
        _id: {
          TYPE: "$TYPE",
          currency: "$currency",
        },
        amount: {
          $sum: "$AMOUNT",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.currency",
        data: {
          $push: {
            TYPE: "$_id.TYPE",
            amount: "$amount",
            count: "$count",
          },
        },
      },
    },
  ]);

  let rakeAmount = 0;
  if (condition && condition.big == "Poker") {
    const rIds = [];
    if (condition.player) {
      const thisPlayer = await MainUser.findOne({ id: condition.player });
      rIds.push(Number(thisPlayer.userOrder));
    } else if (condition.agent) {
      let subPlayers = await this.getAllSubPlayerData(condition.agent);
      for (let i = 0; i < subPlayers.length; i++) {
        rIds.push(Number(subPlayers[i].userOrder));
      }
    } else {
      let subPlayers = await this.getAllSubPlayerData(user.id);
      for (let i = 0; i < subPlayers.length; i++) {
        rIds.push(Number(subPlayers[i].userOrder));
      }
    }

    let start = baseController.get_stand_date_end(condition.date[0]);
    let end = baseController.get_stand_date_end(condition.date[1]);
    let rakeCondition = { $and: [{ date: { $gte: start, $lte: end } }] };

    rakeCondition["$and"].push({ userid: { $in: rIds } });
    let totalRake = await CuracaoRake.aggregate([
      {
        $match: rakeCondition,
      },
      {
        $group: {
          _id: null,
          rake: {
            $sum: "$rake",
          },
        },
      },
    ]);
    rakeAmount = totalRake.length ? totalRake[0].rake : 0;
  }

  return { totalData, rakeAmount };
};

exports.getTotalDataOfBTR = async (newCondition, condition, user) => {
  let totalData = await BonusHistory.aggregate([
    {
      $match: newCondition,
    },
    {
      $group: {
        _id: {
          TYPE: "$TYPE",
          currency: "$currency",
        },
        amount: {
          $sum: "$AMOUNT",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.currency",
        data: {
          $push: {
            TYPE: "$_id.TYPE",
            amount: "$amount",
            count: "$count",
          },
        },
      },
    },
  ]);

  return { totalData };
};

exports.getProviderList = async (req, res) => {
  try {
    let rdata = [];
    let gameList = await GameLists.aggregate([
      {
        $group: {
          _id: "$provider",
          data: {
            $push: {
              LAUNCHURLID: "$LAUNCHURLID",
              detail: "$detail",
              gameId: "$gameId",
              gameName: "$gameName",
            },
          },
        },
      },
      {
        $lookup: {
          from: tblConfig.game_providers,
          localField: "_id",
          foreignField: "_id",
          as: "provider",
        },
      },
      {
        $unwind: "$provider",
      },
    ]);

    for (let i = 0; i < gameList.length; i++) {
      const data = [];
      for (let j = 0; j < gameList[i].data.length; j++) {
        data.push({
          value: gameList[i].data[j].gameId,
          label: gameList[i].data[j].gameName,
        });
      }

      if (gameList[i].data.length) {
        if (gameList[i].data[0].LAUNCHURLID == 1) {
          rdata.push({
            value: gameList[i].data[0].detail.system,
            label: `${gameList[i].provider.providerName} (Softgaming)`,
            id: gameList[i].provider._id,
          });
        } else if (gameList[i].data[0].LAUNCHURLID == 2) {
          rdata.push({
            value: "Live168",
            label: "Live168",
            id: gameList[i].provider._id,
          });
        } else if (gameList[i].data[0].LAUNCHURLID == 3) {
          rdata.push({
            value: "betpoker",
            label: "BetPoker",
            id: gameList[i].provider._id,
          });
        } else if (gameList[i].data[0].LAUNCHURLID == 4) {
          rdata.push({
            value: "TVbet",
            label: "TVbet",
            id: gameList[i].provider._id,
          });
        } else if (gameList[i].data[0].LAUNCHURLID == 5) {
          rdata.push({
            value: gameList[i].provider.providerName,
            label: `${gameList[i].provider.providerName} (Zeus)`,
            id: gameList[i].provider._id,
          });
        } else if (gameList[i].data[0].LAUNCHURLID == 9) {
          rdata.push({
            LAUNCHURLID: gameList[i].data[0].LAUNCHURLID,
            data,
            value: gameList[i].provider._id,
            label: `${gameList[i].provider.providerName} (Iqsoft)`,
            id: gameList[i].provider._id,
          });
        } else if (
          gameList[i].data[0].LAUNCHURLID == 6 ||
          gameList[i].data[0].LAUNCHURLID == 7 ||
          gameList[i].data[0].LAUNCHURLID == 8
        ) {
          rdata.push({
            LAUNCHURLID: gameList[i].data[0].LAUNCHURLID,
            data,
            value: gameList[i].provider.providerName,
            label: gameList[i].provider.providerName,
            id: gameList[i].provider._id,
          });
        }
      }
    }

    rdata.sort((a, b) => (a.label < b.label ? -1 : 1));

    const allProvider = await GameProviders.find({});

    const newProviderList = [];
    for (let i = 0; i < rdata.length; i++) {
      for (let j = 0; j < allProvider.length; j++) {
        if (
          String(rdata[i].id) == String(allProvider[j]._id) &&
          allProvider[j].status
        ) {
          newProviderList.push(rdata[i]);
        }
      }
    }

    return res.status(200).json(newProviderList);
  } catch (error) {
    console.error({
      title: "getProviderList",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
