const axios = require("axios");
const mongoose = require("mongoose");
const requestIp = require("request-ip");
const jwtSign = require("jwt-encode");
const uuidv4 = require("uuid");
const baseController = require("./baseController");
const crypto = require("crypto");

const {
  GameLists,
  GameTypes,
  GameListsNew,
  FreeSpinHistory,
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

const CronJob = require("cron").CronJob;

const timeZone = "Asia/Tokyo";

exports.getGameListsCG = async () => {
  await GameLists.deleteMany({launchUrlId: 1})
  const x_authorization = crypto
    .createHash("sha1")
    .update(
      "games" +
        serverConf.gameAPI.casinoGoild.operatorID +
        serverConf.gameAPI.casinoGoild.secretKey
    )
    .digest("hex");
  const gameList = await baseController.axiosRequest(
    // `${serverConf.gameAPI.casinoGoild.gameURL}/api/generic/games/list/all`,
    `${serverConf.gameAPI.casinoGoild.gameURL}`,
    {},
    "GET",
    {
      "X-Authorization": x_authorization,
      "X-Operator-Id": serverConf.gameAPI.casinoGoild.operatorID,
    }
  );
  let providerList = [];
  gameList.games.map(async (game) => {
    if (!providerList.includes(game.vendor)) {
      providerList.push(game.vendor);
      const md5 = require("md5");
      let newProvider = {
      	providerName: game.vendor,
      	Agregator: "CasinoGold",
      	Precentage: 10,
      	gameType: game.type,
      	providerOrder: 0,
      	status: true,
      	Route: true,
      	image: "",
      	pro_info: "",
      	currency: [],
      	country: []
      }
      await GameProviders(newProvider).save()
    }
    const wager_percent = await this.getWagerContribution(game.title)
    let newgame = {
    	gameId: game.id,
    	gameName: game.title,
    	launchUrlId: 1,
    	imageUrl: game.details.thumbnails["300x300"],
    	gameType: game.type,
    	percentage: wager_percent,
    	provider: game.vendor,
    	isdesktop: game.platform.includes("desktop"),
    	ismobile: game.platform.includes("mobile"),
    	funmode: game.fun_mode,
    	slug: crypto.createHash('sha1').update(game.id.toString(), game.title, "1").digest('hex')
    };
    const saved = await GameLists(newgame).save();
  });
  console.log(providerList, "providerlist==>")
  console.log("finished");
};

exports.getGameListsBO = async () => {
  await GameLists.deleteMany({launchUrlId: 2})
  await GameProviders.deleteMany({Agregator:"BlueOcean"})
  console.log("getGameList from BO")
  const gameList = await baseController.axiosRequest(
    serverConf.gameAPI.BlueOcean.hostURL,
    {
      api_login: serverConf.gameAPI.BlueOcean.api_login,
      api_password: serverConf.gameAPI.BlueOcean.api_password,
      method: "getGameList",
      show_systems: 1,
      show_additional: true,
      currency: "EUR",
    },
    "POST"
  );
  let providerList = []
  gameList.response.map(async (game) => {
  	if(!providerList.includes(game.provider_name)){
  		providerList.push(game.provider_name)
  		let newProvider = {
  			providerName: game.provider_name,
  			Agregator: "BlueOcean",
  			Precentage: 10,
  			gameType: game.type,
  			providerOrder: 0,
  			status: true,
  			Route: true,
  			image: "",
  			pro_info: "",
  			currency: [],
  			country: []
  		}
  		await GameProviders(newProvider).save()
  	}
  })
  console.log(providerList, "blueocean providerlists")

  //Object.keys(gameList.response_provider_logos).map(type => {
  // 	gameList.response_provider_logos[type].map(async (provider) => {
  // 		let newProvider = {
  // 			providerName: provider.name,
  // 			Agregator: "SOFTGAMING",
  // 			Precentage: 10,
  // 			gameType: type,
  // 			providerOrder: 0,
  // 			status: true,
  // 			Route: true,
  // 			image: provider.image_colored,
  // 			pro_info: "",
  // 			currency: [],
  // 			country: []
  // 		}
  // 		await GameProviders(newProvider).save()
  // 	})
  // })

    console.log(gameList.response);

  gameList.response.map(async (game) => {
    // console.log(game);
    const wager_percent = await this.getWagerContribution(game.name)
  	let newgame = {
  		gameId: game.id,
  		gameName: game.name,
  		launchUrlId: 2,
  		percentage: wager_percent,
  		imageUrl: game.image_square,
  		isFeatured: game.featurebuy_supported,
  		isNew: game.new,
  		gameType: game.type,
  		provider: game.provider_name,
  		isdesktop: true,
  		ismobile: game.mobile,
  		funmode: game.play_for_fun_supported,
  		slug: crypto.createHash('sha1').update(game.id_hash, game.name, "2").digest('hex')
  	};
  	const saved_game = await GameLists(newgame).save();
  })
  console.log("finished");
};

exports.getGameListsRyan = async () => {
  // await GameLists.deleteMany({launchUrlId: 3})
  // await GameProviders.deleteMany({Agregator:"Ryan"})
  const gameList = await baseController.axiosRequest(
    serverConf.gameAPI.Ryan.hostURL,
    {
      api_login: serverConf.gameAPI.Ryan.api_login,
      api_password: serverConf.gameAPI.Ryan.api_password,
      method: "getGameList",
      show_systems: 1,
      show_additional: true,
      currency: "EUR",
    },
    "POST"
  );
  let providerList = [];
  gameList.response.map(async (game) => {
    if (!providerList.includes(game.provider_name)) {
      providerList.push(game.provider_name);
      let newProvider = {
        providerName: game.provider_name,
        Agregator: "Ryan",
        Precentage: 10,
        gameType: game.type,
        providerOrder: 0,
        status: true,
        Route: true,
        image: "",
        pro_info: "",
        currency: [],
        country: [],
      };
      await GameProviders(newProvider).save();
    }
    // const wager_percent = await this.getWagerContribution(game.name)
    //  let newgame = {
    //  	gameId: game.id_hash,
    //  	gameName: game.name,
    //  	launchUrlId: 3,
    //  	percentage: wager_percent,
    //  	imageUrl: game.image_square,
    //  	isFeatured: game.featurebuy_supported,
    //  	isNew: game.new,
    //  	gameType: game.type,
    //  	provider: game.provider_name,
    //  	isdesktop: true,
    //  	ismobile: game.mobile,
    //  	funmode: game.play_for_fun_supported,
    //  	slug: crypto.createHash('sha1').update(game.id_hash, game.name, "3").digest('hex')
    //  };
    //  const saved_game = GameLists(newgame).save();
  });
  // console.log(gameList.response.length, "rrrrr=================>")
  console.log(providerList, "provider+=====================>");
  console.log("finished");
};

exports.openDemoGame = async (req, res) => {
  try {
    const { slug, language, device } = req.body;

    if (slug) {
      const realGame = await GameLists.findOne({ slug });
      this.getDemoGameLaunchUrlOfGame(
        realGame,
        language,
        device,
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

exports.getDemoGameLaunchUrlOfGame = async (realGame, language, device, cb) => {
  try {
    let gameLaunchData;
    switch (realGame.launchUrlId) {
      case 1:
        if (
          [
            "amatic",
            "egtjackpot",
            "netent",
            "quickspin",
            "wazdan",
            "pragmaticplay",
            "playngo",
            "greentube",
            "merkur",
          ].includes(realGame.provider)
        )
          gameLaunchData = `${serverConf.gameAPI.casinoGoild.hostURL2}?operator_id=${serverConf.gameAPI.casinoGoild.operatorID}&mode=fun&game_id=${realGame.gameId}&language=${language}&device=${device}&home_url=http://test-europa777.com/casino`;
        else
          gameLaunchData = `${serverConf.gameAPI.casinoGoild.hostURL1}?operator_id=${serverConf.gameAPI.casinoGoild.operatorID}&mode=fun&game_id=${realGame.gameId}&language=${language}&device=${device}&home_url=http://test-europa777.com/casino`;
        break;
      case 2:
        if (realGame.gameType == "sportsbook") {
          gameData = await baseController.axiosRequest(
            serverConf.gameAPI.BlueOcean.hostURL,
            {
              api_login: serverConf.gameAPI.BlueOcean.api_login,
              api_password: serverConf.gameAPI.BlueOcean.api_password,
              method: "getGameDemo",
              lang: language,
              gameid: realGame.gameId,
              homeurl: "http://test-europa777.com/casino",
              currency: "EUR",
            },
            "POST"
          );
          console.log(gameData);
        } else {
          gameData = await baseController.axiosRequest(
            serverConf.gameAPI.BlueOcean.hostURL,
            {
              api_login: serverConf.gameAPI.BlueOcean.api_login,
              api_password: serverConf.gameAPI.BlueOcean.api_password,
              method: "getGame",
              lang: language,
              gameid: realGame.gameId,
              homeurl: "http://test-europa777.com/casino",
              play_for_fun: true,
              currency: "EUR",
            },
            "POST"
          );
        }
        if (gameData.error == 0) gameLaunchData = gameData.response;
        else {
          cb(false, gameData.message);
          return;
        }
        break;
      case 3:
        gameData = await baseController.axiosRequest(
          serverConf.gameAPI.Ryan.hostURL,
          {
            api_login: serverConf.gameAPI.Ryan.api_login,
            api_password: serverConf.gameAPI.Ryan.api_password,
            method: "getGameDemo",
            lang: language,
            gameid: realGame.gameId,
            homeurl: "http://test-europa777.com/casino",
            cashierurl: "http://test-europa777.com",
            currency: "EUR",
          },
          "POST"
        );
        if (gameData.error == 0) gameLaunchData = gameData.response;
        else {
          cb(false, gameData.message);
          return;
        }
        break;
    }
    cb({ url: gameLaunchData });
  } catch (error) {
    cb(false, "Server Error");
  }
};

exports.openGame = async (req, res) => {
  try {
    const { slug, language, device } = req.body;

    if (slug) {
      let user = req.user;
      let newRecentPlay = user.recentPlay;
      if (newRecentPlay.includes(slug)) {
        newRecentPlay.splice(newRecentPlay.indexOf(slug), 1);
      } else if (newRecentPlay.length > 5) {
        newRecentPlay.pop();
      }
      newRecentPlay.unshift(slug);
      console.log("newRecentPlay", newRecentPlay);
      const newUser = await MainUser.findOneAndUpdate(
        { _id: user._id },
        { recentPlay: newRecentPlay },
        { new: true, upsert: true }
      );
      const realGame = await GameLists.findOneAndUpdate(
        { slug },
        { $inc: { opens: 1 } },
        { new: true }
      );
      console.log(realGame, "realGame===>")
      this.getGameLaunchUrlOfGame(
        user,
        realGame,
        language,
        device,
        async (urlData, errMsg) => {
          if (urlData) {
            return res.status(200).send(urlData);
          } else {
            return res.status(400).send(errMsg);
          }
        }
      );
    } else {
      return res.status(400).send("Can't get game slug");
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

exports.getWagerContribution = async (title) => {
  if (
    title.includes("Jackpot") ||
    title.includes("Baccarat") ||
    title.includes("Craps") ||
    title.includes("Sic Bo") ||
    title.includes("Progressive")
  ) {
    return 0;
  } else if (
    title.includes("Poker Table") ||
    title.includes("Video-Poker") ||
    title.includes("Roulette") ||
    title.includes("Poker Table") ||
    title.includes("Blackjack") ||
    title.includes("Casino War")
  ) {
    return 8;
  } else if (
    (title.includes("Classic") && title.includes("Blackjack")) ||
    title.includes("Jacks or Better")
  ) {
    return 2;
  } else {
    return 100;
  }
};
exports.getGameLaunchUrlOfGame = async (
  user,
  realGame,
  language,
  device,
  cb
) => {
  try {
    const userSession = await UserSession.findOne({ id: user.id });
    let gameLaunchData;
    switch (realGame.launchUrlId) {
      case 1:
        if (
          [
            "amatic",
            "egtjackpot",
            "netent",
            "quickspin",
            "wazdan",
            "pragmaticplay",
            "playngo",
            "greentube",
            "merkur",
          ].includes(realGame.provider)
        )
          gameLaunchData = `${serverConf.gameAPI.casinoGoild.hostURL2}?operator_id=${serverConf.gameAPI.casinoGoild.operatorID}&mode=real&game_id=${realGame.gameId}&token=${userSession.hash}${realGame.gameId}${realGame.opens}&currency=${user.dis_currency}&language=${language}&device=${device}&home_url=http://test-europa777.com/casino`;
        else
          gameLaunchData = `${serverConf.gameAPI.casinoGoild.hostURL1}?operator_id=${serverConf.gameAPI.casinoGoild.operatorID}&mode=real&game_id=${realGame.gameId}&token=${userSession.hash}${realGame.gameId}${realGame.opens}&currency=${user.dis_currency}&language=${language}&device=${device}&home_url=http://test-europa777.com/casino`;
        break;
      case 2:
        let userData = await baseController.axiosRequest(
          serverConf.gameAPI.BlueOcean.hostURL,
          {
            api_login: serverConf.gameAPI.BlueOcean.api_login,
            api_password: serverConf.gameAPI.BlueOcean.api_password,
            method: "playerExists",
            user_username: user.username,
            currency: user.dis_currency,
          },
          "POST"
        );
        if (!userData.response) {
          userData = await baseController.axiosRequest(
            serverConf.gameAPI.BlueOcean.hostURL,
            {
              api_login: serverConf.gameAPI.BlueOcean.api_login,
              api_password: serverConf.gameAPI.BlueOcean.api_password,
              method: "createPlayer",
              user_username: user.username,
              user_nickname: user.username,
              user_password: user.password,
              currency: user.dis_currency,
            },
            "POST"
          );
        }
        await UserSession.findOneAndUpdate(
          { id: user.id },
          { gameProfile: userData.response }
        );
        if (realGame.gameType == "sportsbook") {
          let data = await baseController.axiosRequest(
            serverConf.gameAPI.BlueOcean.hostURL,
            {
              api_login: serverConf.gameAPI.BlueOcean.api_login,
              api_password: serverConf.gameAPI.BlueOcean.api_password,
              method: "getGameDirect",
              lang: language,
              user_username: user.username,
              user_password: user.password,
              gameid: realGame.gameId,
              homeurl: "http://test-europa777.com/casino",
              play_for_fun: false,
              currency: user.dis_currency,
            },
            "POST"
          );
          if (data.error == 0)
            gameData = { error: data.error, response: data.response.url };
          else gameData = data;
        } else {
          gameData = await baseController.axiosRequest(
            serverConf.gameAPI.BlueOcean.hostURL,
            {
              api_login: serverConf.gameAPI.BlueOcean.api_login,
              api_password: serverConf.gameAPI.BlueOcean.api_password,
              method: "getGame",
              lang: language,
              user_username: user.username,
              user_password: user.password,
              gameid: realGame.gameId,
              homeurl: "http://test-europa777.com/casino",
              play_for_fun: false,
              currency: user.dis_currency,
            },
            "POST"
          );
        }
        if (gameData.error == 0) gameLaunchData = gameData.response;
        else {
          console.log(gameData, "bo gamedata===>")
          cb(false, gameData.message);
          return;
        }
        break;
      case 3:
        // if(user.freespin.count > 0){
        // 	const addFreeSpins = await baseController.axiosRequest(
        // 		serverConf.gameAPI.Ryan.hostURL,
        // 		{
        // 			api_login : serverConf.gameAPI.Ryan.api_login,
        // 			api_password: serverConf.gameAPI.Ryan.api_password,
        // 			method: "addFreeRounds",
        // 			gameid: "softswiss/GoldRushWithJohnny",
        // 			freespins: user.freespin.count,
        // 			bet_level: 0,
        // 			valid_days: 3,
        // 			user_username: user.username,
        // 			user_password: user.password,
        // 			currency: user.dis_currency
        // 		}, "POST"
        // 	)
        // 	console.log(addFreeSpins, "__________")
        // }
        if (user.freespin.amount >= 50) {
          const freespinGames = [
            "softswiss/BeastBand",
            "softswiss/GoldRushWithJohnny",
            "softswiss/JohnnyCash",
          ];
          const addFreeSpins = await baseController.axiosRequest(
            serverConf.gameAPI.Ryan.hostURL,
            {
              api_login: serverConf.gameAPI.Ryan.api_login,
              api_password: serverConf.gameAPI.Ryan.api_password,
              method: "addFreeRounds",
              gameid: freespinGames[user.deposited % 3],
              freespins: 50,
              bet_level: 0,
              valid_days: 3,
              user_username: user.username,
              user_password: user.password,
              currency: user.dis_currency,
            },
            "POST"
          );
          await MainUser.findOneAndUpdate(
            { _id: user._id },
            { $inc: { "freespin.amount": -50 }, "freespin.addAt": Date.now() }
          );
        }
        let userDataR = await baseController.axiosRequest(
          serverConf.gameAPI.Ryan.hostURL,
          {
            api_login: serverConf.gameAPI.Ryan.api_login,
            api_password: serverConf.gameAPI.Ryan.api_password,
            method: "createPlayer",
            user_username: user.username,
            user_nickname: user.username,
            user_password: user.password,
            currency: user.dis_currency,
          },
          "POST"
        );
        console.log(userDataR);
        await UserSession.findOneAndUpdate(
          { id: user.id },
          { gameProfile: userDataR.response }
        );
        gameData = await baseController.axiosRequest(
          serverConf.gameAPI.Ryan.hostURL,
          {
            api_login: serverConf.gameAPI.Ryan.api_login,
            api_password: serverConf.gameAPI.Ryan.api_password,
            method: "getGame",
            lang: language,
            user_username: user.username,
            user_password: user.password,
            gameid: realGame.gameId,
            homeurl: "http://test-europa777.com/casino",
            cashierurl: "http://test-europa777.com",
            play_for_fun: false,
            currency: user.dis_currency,
          },
          "POST"
        );
        if (gameData.error == 0) gameLaunchData = gameData.response;
        else {
          cb(false, gameData.message);
          return;
        }
        break;
    }
    cb({ url: gameLaunchData });
  } catch (error) {
    cb(false, "Server Error");
  }
};

// Get Game Provider Information
exports.getProviders = async (req, res) => {
  try {
    const { gameType } = req.body;
    let searchCondition = {};
    switch (gameType) {
      case "live":
        searchCondition = {
          gameType: { $in: ["livecasino", "live-casino-table"] },
        };
        break;
      case "slots":
        searchCondition = {
          gameType: { $in: ["slots", "video-slots", "scratch-cards"] },
        };
        break;
      case "table":
        searchCondition = { gameType: { $in: ["table-games"] } };
        break;
      case "tvbet":
        searchCondition = { gameType: { $in: ["livegames"] } };
        break;
      case "virtual":
        searchCondition = {
          gameType: { $in: ["virtual-games", "virtual-sports"] },
        };
        break;
    }
    const data = await GameProviders.find(searchCondition);
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

// Game Relate Part
exports.getGameChild = async (
  gameType,
  page,
  perPage,
  provider,
  gameName,
  device
) => {
  const match = {
    $and: [{ gameName: { $regex: gameName ? gameName : "", $options: "i" } }],
  };

  if (!(provider == "All")) {
    match["$and"].push({
      provider,
    });
  }

  if (device < 991) {
    match["$and"].push({ isMobile: true });
  } else {
    match["$and"].push({ isDesktop: true });
  }

  if (gameType == "live") {
    match["$and"].push({
      gameType: { $in: ["livecasino", "live-casino-table"] },
    });
  } else if (gameType == "slots") {
    match["$and"].push({
      gameType: { $in: ["slots", "video-slots", "scratch-cards"] },
    });
  } else if (gameType == "table") {
    match["$and"].push({ gameType: { $in: ["table-games"] } });
  } else if (gameType == "tvbet") {
    match["$and"].push({ gameType: { $in: ["livegames"] } });
  } else if (gameType == "virtual") {
    match["$and"].push({
      gameType: { $in: ["virtual-games", "virtual-sports"] },
    });
  } else if (gameType == "new") {
    match["$and"].push({ isNew: true });
  } else if (gameType == "popular") {
    match["$and"].push({ isFeatured: true });
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
  console.log("page, perpage", page, perPage);
  let data;
  if (gameType == "top")
    data = await GameLists.find(match)
      .sort({ opens: -1 })
      .skip(page * perPage)
      .limit(perPage);
  else
    data = await GameLists.find(match)
      .skip(page * perPage)
      .limit(perPage);
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

exports.getGamesBySlug = async (req, res) => {
  try {
    const { slug } = req.body;
    const game = await GameLists.find({ slug: slug });
    res.status(200).json(game);
  } catch (error) {
    console.error({
      title: "getGameBySlug",
      message: error.message,
      date: new Date(),
      error,
    });
    return res.status(500).send("Server Error");
  }
};

exports.freespin = async (req, res) => {
  const { fs, fund } = req.body;
  const timestamp = Date.now();
  const user = await MainUser.findOne({ _id: req.user._id });
  const newUser = await MainUser.findOneAndUpdate(
    { _id: user._id },
    {
      freespin: {
        ...user.freespin,
        count: parseInt(user.freespin.count) - 1 + parseInt(fs),
        lastSpin: timestamp,
      },
      balance: {
        ...user.balance,
        EUR: (parseFloat(user.balance["EUR"]) + parseFloat(fund)),
      },
    },
    { new: true, upsert: true }
  );
  if (newUser) res.status(200).json({ status: "200", data: newUser.freespin });
  else res.status(200).json({ status: "500", data: "Operation Failed." });
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

// Game Bet History Part
exports.getGameHistory = async (req, res) => {
  try {
    // let { parsedFilter, condition } = req.body
    const user = req.user;
    // if (new Date(condition.date[1]).valueOf() - new Date(condition.date[0]).valueOf() >= 1000 * 3600 * 24 * 62) {
    // 	return res.status(500).send("Please select duration below 2 months")
    // }
    // let newCondition = await this.getSearchDataOfTR(condition, req.user)
    // let totalDWData = await this.getTotalDataOfTR(newCondition, condition, req.user)
    // let count = await BetHistory.countDocuments({USERID: user._id})
    const getUserGameHistory = await BetHistory.find({ USERID: user._id });
    let userGameLists = [];
    let userGameTr = [];
    let betsum = 0,
      winsum = 0;
    if (getUserGameHistory && getUserGameHistory.length > 0) {
      getUserGameHistory.map((item) => {
        if (!userGameLists.includes(item.GAMEID)) {
          userGameLists.push(item.GAMEID);
        }
      });
      for (const gameId of userGameLists) {
        const eachGameHistory = await BetHistory.find({
          USERID: user._id,
          GAMEID: gameId,
        });
        const gameTypeLists = await GameLists.findOne({ gameId: gameId });
        console.log(gameTypeLists, "gameTypeLists===============>");
        const gameType = gameTypeLists.gameType;
        if (eachGameHistory && eachGameHistory.length > 0) {
          for (const eGame of eachGameHistory) {
            if (eGame.TYPE == "BET") {
              betsum += eGame.AMOUNT;
            } else {
              winsum += eGame.AMOUNT;
            }
            userGameTr.push([
              gameId,
              gameType,
              betsum,
              winsum,
              eachGameHistory[eachGameHistory.length - 1].updatedbalance,
              eGame.currency,
              eachGameHistory[eachGameHistory.length - 1].updatedAt,
            ]);
          }
        }
      }
      console.log(userGameTr, "userGameTr======>");
      return res.status(200).json({ msg: "success", data: userGameTr });
    } else {
      return res.status(400).send("User not found!");
    }
    // let pages = await baseController.setPage(parsedFilter, count)

    // let data = await BetHistory.aggregate([{
    // 	$match: newCondition
    // },
    // {
    // 	$sort: {
    // 		createdAt: -1
    // 	}
    // },
    // {
    // 	$limit: pages.limit
    // },
    // {
    // 	$skip: pages.skip
    // },
    // {
    // 	$lookup: {
    // 		from: tblConfig.users,
    // 		localField: "USERID",
    // 		foreignField: "id",
    // 		as: "user"
    // 	}
    // },
    // {
    // 	$unwind: "$user"
    // },
    // {
    // 	$project: {
    // 		user: "$user.username",
    // 		game: "$GAMEID",
    // 		LAUNCHURL: "$LAUNCHURL",
    // 		amount: "$AMOUNT",
    // 		type: "$TYPE",
    // 		transactionId: "$transactionId",
    // 		lastbalance: "$lastbalance",
    // 		updatedbalance: "$updatedbalance",
    // 		currency: "$currency",
    // 		createdAt: "$createdAt"
    // 	}
    // }
    // ])

    // pages["skip1"] = data.length ? pages.skip + 1 : 0
    // pages["skip2"] = (pages.skip) + data.length
    // return res.status(200).json({ data, totalCount: count, totalDWData })
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

exports.getFreeSpinsHistory = async (req, res) => {
  const user = req.user;
  const getFsHistory = await FreeSpinHistory.find({
    userId: mongoose.Types.ObjectId(user._id),
  });
  if (getFsHistory) {
    res.status(200).json({ msg: "success", data: getFsHistory });
  } else {
    res.status(400).send("no data");
  }
};
