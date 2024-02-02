const md5 = require("md5");
const uuidv4 = require("uuid");
const requestIp = require("request-ip");
const FundistService = require("../services/fundistService");
const fundistService = FundistService.getInstance();
const ObjectId = require("mongoose").Types.ObjectId;

const {
  SupportTypes,
  SupportData,
  SiteConfigs,
  SliderDatas,
  NotificationList,
  LogHistory,
  LogAttemptHistory,
  BonusList,
  BonusArchive,
  UserVerify,
  MainUser,
  UserSession,
  EmailTemplateList,
  LanguageList,
  MultiLangList,
  VipList,
  PriceConfig,
  CurrencyList,
  CountryList,
  PaymentList,
  NotifyTemplateList,
  PokerSliderDatas,
  AgentPermission,
  GameLists,
  SidebarMainMenu,
  FooterMenuList,
  BonusTaCList,
} = require("../models");

const baseController = require("./baseController");
const gameController = require("./gameController");

const tblConfig = require("../config/tablemanage");
const proConf = require("../config/provider");
const serverConf = require("../../serverConf");

// Get Site Config
exports.getRequestLog = async (req, res) => {
  try {
    let ip = requestIp.getClientIp(req);
    if (ip == "::1") ip = "8.8.8.8";
    const requestAttempt = await this.getLogHistoryStatusChild(ip);
    return res.status(200).json(requestAttempt);
  } catch (error) {
    console.error({
      title: "getAllConfig",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getPlayerBaseData = async (req, res) => {
  try {
    let ip = requestIp.getClientIp(req);
    const userCountry = await baseController.getUserCountry(ip, 'EN');
    const currencyData = await CurrencyList.find({ status: true });
    const vipData = await VipList.find({ status: true });
    const languageData = await LanguageList.find({ status: true });
    const countryData = await CountryList.find({ status: true });
    return res
      .status(200)
      .json({ currencyData, vipData, languageData, countryData, countryData, userCountry });
  } catch (error) {
    console.error({
      title: "getPlayerBaseData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getPlayerContentData = async (req, res) => {
  try {
    const proImgData = await GameLists.aggregate([
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
        $match: {
          "provider.image": { $ne: "" },
        },
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
        },
      },
    ]);

    const mainMenuData = await SidebarMainMenu.aggregate([
      {
        $match: {
          status: true,
        },
      },
      {
        $lookup: {
          from: tblConfig.site_sidebar_base_menu,
          localField: "base",
          foreignField: "_id",
          as: "data",
        },
      },
      {
        $unwind: "$data",
      },
      {
        $match: {
          "data.status": true,
        },
      },
      {
        $sort: {
          order: 1,
        },
      },
      {
        $group: {
          _id: {
            name: "$data.name",
            order: "$data.order",
          },
          data: {
            $push: {
              name: "$name",
              url: "$url",
              sidebar: "$sidebar",
              image: "$image",
              mobileSidebar: "$mobileSidebar",
              onHome: "$onHome",
              onGame: "$onGame",
              onMBFooter: "$onMBFooter",
            },
          },
        },
      },
      {
        $sort: {
          "_id.order": 1,
        },
      },
      {
        $project: {
          _id: null,
          name: "$_id.name",
          data: "$data",
        },
      },
    ]);

    const footerMenuData = await FooterMenuList.aggregate([
      {
        $match: {
          status: true,
        },
      },
      {
        $sort: {
          order: 1,
        },
      },
    ]);

    return res.status(200).json({ proImgData, mainMenuData, footerMenuData });
  } catch (error) {
    console.error({
      title: "getPlayerContentData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getAllConfig = async (req, res) => {
  try {
    let ip = requestIp.getClientIp(req);
    if (ip == "::1") ip = "8.8.8.8";
    const myData = await baseController.getUserData(ip);
    const siteData = await SiteConfigs.find({});
    return res.status(200).json({ myData, siteData });
  } catch (error) {
    console.error({
      title: "getAllConfig",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// getHomePageContentData in Dashboard
exports.getHomePageContentData = async (req, res) => {
  try {
    const homeSliderData = await SliderDatas.find({ status: true }).sort({
      order: 1,
    });
    const homePromoData = await BonusList.find({ status: true }).sort({
      order: 1,
    });

    return res.status(200).json({
      homeSliderData,
      homePromoData,
    });
  } catch (error) {
    console.error({
      title: "getHomePageContentData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Home Page Game list in dashboard
exports.getHomePageGameData = async (req, res) => {
  try {
    const providerData = await gameController.getProviderListSubFunc(
      "",
      req.headers.device,
      req.user
    );
    const featuredGames = await GameLists.find({ isFeatured: true }).limit(12);
    const topGames = await GameLists.find().sort({ opens: -1 }).limit(12);
    const newGames = await GameLists.find({ isNew: true }).limit(12);
    const liveGames = await GameLists.find({
      gameType: { $in: ["live-casino-table", "livecasino"] },
    }).limit(12);
    const slotGames = await GameLists.find({
      gameType: { $in: ["video-slots", "table-games"] },
    }).limit(12);
    const token = req.headers.authorization;
    const session = await UserSession.findOne({ token });
    if (session) {
      const user = await MainUser.findOne({ _id: session.id });
      console.log("user.recentPlay", user.recentPlay);
      const recent = await GameLists.find({ slug: { $in: user.recentPlay } });
      return res.status(200).json({
        featuredGames,
        providerData,
        topGames,
        newGames,
        liveGames,
        slotGames,
        recent,
      });
    } else {
      return res.status(200).json({
        featuredGames,
        providerData,
        topGames,
        newGames,
        liveGames,
        slotGames,
      });
    }
  } catch (error) {
    console.error({
      title: "getHomePageGameData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// getPokerSliderList in Dashboard
exports.getPokerSliderList = async (req, res) => {
  try {
    const data = await PokerSliderDatas.find({ status: true }).sort({
      order: 1,
    });
    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "getPokerSliderList",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Support Data in Support Page
exports.getSupportTypes = async (req, res) => {
  try {
    const data = await SupportTypes.find({ status: true });
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getSupportTypes",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getSupportData = async (req, res) => {
  try {
    const { currentType } = req.body;
    if (!currentType) {
      return res.status(400).send("Wrong Parameter");
    }
    const data = await SupportData.find({ type: currentType, status: true });
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getSupportData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// Notification Management Part
exports.getMyNotification = async (req, res) => {
  try {
    const data = await NotificationList.aggregate([
      {
        $match: {
          receiver: {
            $elemMatch: {
              _id: String(req.user.id),
              saw: false,
            },
          },
          method: "site",
        },
      },
      {
        $lookup: {
          from: tblConfig.users,
          localField: "sender",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $unwind: "$sender",
      },
      {
        $project: {
          content: "$content",
          sender: "$sender.username",
          avatar: "$sender.avatar",
          auto: "$auto",
        },
      },
    ]);
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getMyNotification",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getMyNotificationCount = async (id) => {
  try {
    const data = await NotificationList.aggregate([
      {
        $match: {
          receiver: {
            $elemMatch: {
              _id: String(id),
              saw: false,
            },
          },
          method: "site",
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);
    return data.length ? data[0].count : 0;
  } catch (error) {
    return 0;
  }
};

exports.readAllNotification = async (req, res) => {
  try {
    const data = await NotificationList.find({
      receiver: {
        $elemMatch: {
          _id: String(req.user.id),
          saw: false,
        },
      },
    });

    for (let i = 0; i < data.length; i++) {
      const update = data[i].receiver;
      for (let j = 0; j < update.length; j++) {
        if (update[j]._id == String(req.user.id)) {
          update[j].saw = true;
        }
      }
      await NotificationList.updateOne(
        { _id: data[i]._id },
        { receiver: update }
      );
    }
    return res.status(200).send(true);
  } catch (error) {
    console.error({
      title: "readAllNotification",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// Promotion Page
exports.getFundistBonusStatus = async (req, res) => {
  try {
    const flag = await baseController.axiosRequest(
      `${serverConf.apiUrl}/api/getFundistBonusData`,
      { id: req.user.id },
      "POST"
    );
    if (flag && flag.status) {
      const data = await BonusArchive.find({ userId: req.user.id });
      return res.status(200).json(data);
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "getFundistBonusStatus",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getPromoItemList = async (req, res) => {
  try {
    const data = await BonusList.find({ status: true }).sort({ order: 1 });
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getPromoItemList",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getBonusList = async (req, res) => {
  try {
    const data = await BonusList.find({}).sort({ order: 1 });
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getBonusList",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.cancelBonus = async (req, res) => {
  try {
    const user = req.user;
    const bonusItem = req.body;
    const ip = requestIp.getClientIp(req);

    const agentUser = await AgentPermission.findOne({ id: user.created });

    if (agentUser && agentUser.useBonus) {
      const dpbonus = await BonusList.findOne({ _id: bonusItem._id });
      if (dpbonus) {
        const data = await BonusArchive.findOne({
          userId: user.id,
          bonusId: dpbonus.bonusId,
        });
        if (!data) {
          if (!user.softId) {
            const TID = uuidv4.v4();
            const Hash = md5(
              `User/Add/${proConf.SOFTGAM.IP}/${TID}/${proConf.SOFTGAM.APIKEY}/${serverConf.prefix}_${user.username}_${user.dis_currency}/${user.username}/${user.dis_currency}/${proConf.SOFTGAM.APIPASS}`
            );
            await baseController.axiosRequest(
              `${proConf.SOFTGAM.ENDPOINT}System/Api/${proConf.SOFTGAM.APIKEY}/User/Add/?` +
                `&Login=${serverConf.prefix}_${user.username}_${user.dis_currency}&Password=${user.username}` +
                `&TID=${TID}&Currency=${user.dis_currency}&Language=en&Hash=${Hash}&RegistrationIP=${ip}`,
              {},
              "POST"
            );
            await baseController.axiosRequest(
              `${serverConf.apiUrl}/api/updateSoftgameData`,
              {},
              "POST"
            );
          }

          const loyaltyRecords = await fundistService.cancelBonus(
            ip,
            user,
            dpbonus.bonusId
          );
          if (loyaltyRecords.data.includes("1,")) {
            await BonusArchive.create({
              userId: user.id,
              bonusId: dpbonus.bonusId,
              status: "canceled",
              detail: {},
            });

            const nData = await NotifyTemplateList.findOne({
              name: "canceledfdbonus",
            });
            if (nData && user.notify_site) {
              const receiver = [
                {
                  _id: String(user._id),
                  verify_email: user.verify_email,
                  verify_sms: user.verify_sms,
                  language: user.language,
                  email: user.email,
                  phone: user.phone,
                  name: user.username,
                  saw: true,
                },
              ];
              const lang = user.language || "en";
              let letter = nData.param[lang]
                ? nData.param[lang].letter
                : nData.param["en"].letter;
              letter = letter
                .split("<username>")
                .join(`<b>${user.username}</b>`);
              NotificationList.create({
                method: "site",
                receiver,
                sender: user.created,
                auto: true,
                content: JSON.stringify({
                  title_site: nData.param[user.language].title,
                  content_site: `<span>${letter}</span>`,
                }),
              });
            }

            return res.status(200).send(true);
          } else {
            console.error(loyaltyRecords, "loyaltyRecords");
            return res.status(400).send("Failure");
          }
        } else {
          return res.status(400).send("Already canceled");
        }
      } else {
        return res.status(400).send("Wrong Parameter");
      }
    } else {
      return res.status(400).send("You are not allowed to use bonus system");
    }
  } catch (error) {
    console.error({ title: "canceledBonus", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

exports.selectDepositBonus = async (req, res) => {
  try {
    const user = req.user;
    const bonusItem = req.body;
    const ip = requestIp.getClientIp(req);

    if (user.deposited) {
      return res.status(400).send("You already did first deposit");
    }

    const agentUser = await AgentPermission.findOne({ id: user.created });

    if (agentUser && agentUser.useBonus) {
      const dpbonus = await BonusList.findOne({ _id: bonusItem._id });
      if (dpbonus) {
        const data = await BonusArchive.findOne({
          userId: user.id,
          bonusId: dpbonus.bonusId,
        });
        if (!data) {
          if (!user.softId) {
            const TID = uuidv4.v4();
            const Hash = md5(
              `User/Add/${proConf.SOFTGAM.IP}/${TID}/${proConf.SOFTGAM.APIKEY}/${serverConf.prefix}_${user.username}_${user.dis_currency}/${user.username}/${user.dis_currency}/${proConf.SOFTGAM.APIPASS}`
            );
            await baseController.axiosRequest(
              `${proConf.SOFTGAM.ENDPOINT}System/Api/${proConf.SOFTGAM.APIKEY}/User/Add/?` +
                `&Login=${serverConf.prefix}_${user.username}_${user.dis_currency}&Password=${user.username}` +
                `&TID=${TID}&Currency=${user.dis_currency}&Language=en&Hash=${Hash}&RegistrationIP=${ip}`,
              {},
              "POST"
            );
            await baseController.axiosRequest(
              `${serverConf.apiUrl}/api/updateSoftgameData`,
              {},
              "POST"
            );
          }

          const loyaltyRecords = await fundistService.selectBonus(
            ip,
            user,
            dpbonus.bonusId
          );
          if (loyaltyRecords.data.includes("1,")) {
            await BonusArchive.create({
              userId: user.id,
              bonusId: dpbonus.bonusId,
              status: "subscribed",
              detail: {},
            });

            const nData = await NotifyTemplateList.findOne({
              name: "subfdbonus",
            });
            if (nData && user.notify_site) {
              const receiver = [
                {
                  _id: String(user._id),
                  verify_email: user.verify_email,
                  verify_sms: user.verify_sms,
                  language: user.language,
                  email: user.email,
                  phone: user.phone,
                  name: user.username,
                  saw: false,
                },
              ];
              const lang = user.language || "en";
              let letter = nData.param[lang]
                ? nData.param[lang].letter
                : nData.param["en"].letter;
              letter = letter
                .split("<username>")
                .join(`<b>${user.username}</b>`);
              NotificationList.create({
                method: "site",
                receiver,
                sender: user.created,
                auto: true,
                content: JSON.stringify({
                  title_site: nData.param[user.language].title,
                  content_site: `<span>${letter}</span>`,
                }),
              });
            }

            return res.status(200).send(true);
          } else {
            console.error(loyaltyRecords, "loyaltyRecords");
            return res.status(400).send("Failure");
          }
        } else {
          return res.status(400).send("Already subscribed");
        }
      } else {
        return res.status(400).send("Wrong Parameter");
      }
    } else {
      return res.status(400).send("You are not allowed to use bonus system");
    }
  } catch (error) {
    console.error({
      title: "selectDepositBonus",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// Multi Language
exports.getMultilang = async (req, res) => {
  try {
    const langs = await LanguageList.find({ status: true });
    const data = await MultiLangList.find({});
    const rdata = {};
    for (let i = 0; i < data.length; i++) {
      if (!rdata[data[i].language]) {
        rdata[data[i].language] = {
          [data[i].text]: data[i].transtext,
        };
      } else {
        rdata[data[i].language][data[i].text] = data[i].transtext;
      }
    }
    return res.status(200).json({ langs, data: rdata });
  } catch (error) {
    console.error({
      title: "getMultilang",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// This is for sent notification to suer when user finish activation
exports.sendFirstpartNotification = async (user) => {
  if (!user.notify_site) return;

  const lang = user.language || "en";
  const nData = await NotifyTemplateList.findOne({ name: "activate" });
  const receiver = [
    {
      _id: String(user._id),
      verify_email: user.verify_email,
      verify_sms: user.verify_sms,
      language: user.language,
      email: user.email,
      phone: user.phone,
      name: user.username,
      saw: false,
    },
  ];

  if (nData) {
    let letter = nData.param[lang]
      ? nData.param[lang].letter
      : nData.param["en"].letter;
    letter = letter.split("<username>").join(`<b>${user.username}</b>`);
    NotificationList.create({
      method: "site",
      receiver,
      sender: user.created,
      auto: true,
      content: JSON.stringify({
        title_site: nData.param[user.language].title,
        content_site: `<span>${letter}</span>`,
      }),
    });
  }

  const nData1 = await NotifyTemplateList.findOne({ name: "registerbonus" });
  if (nData1) {
    let letter = nData1.param[lang]
      ? nData1.param[lang].letter
      : nData1.param["en"].letter;
    letter = letter.split("<username>").join(`<b>${user.username}</b>`);
    letter = letter
      .split("<>")
      .join(`<a href="${serverConf.SiteUrl}/profile?page=0">`);
    letter = letter.split("</>").join(`</a>`);
    NotificationList.create({
      method: "site",
      receiver,
      sender: user.created,
      auto: true,
      content: JSON.stringify({
        title_site: nData1.param[user.language].title,
        content_site: `<span>${letter}</span>`,
      }),
    });
  }

  const nData2 = await NotifyTemplateList.findOne({ name: "welcomebonus" });
  if (nData2) {
    let letter = nData2.param[lang]
      ? nData2.param[lang].letter
      : nData2.param["en"].letter;
    letter = letter.split("<username>").join(`<b>${user.username}</b>`);
    letter = letter
      .split("<>")
      .join(`<a href="${serverConf.SiteUrl}/promotion">`);
    letter = letter.split("</>").join(`</a>`);

    NotificationList.create({
      method: "site",
      receiver,
      sender: user.created,
      auto: true,
      content: JSON.stringify({
        title_site: nData2.param[user.language].title,
        content_site: `<span>${letter}</span>`,
      }),
    });
  }

  const nData3 = await NotifyTemplateList.findOne({ name: "verifybonus" });
  if (nData3) {
    let letter = nData3.param[lang]
      ? nData3.param[lang].letter
      : nData3.param["en"].letter;
    letter = letter.split("<username>").join(`<b>${user.username}</b>`);
    NotificationList.create({
      method: "site",
      receiver,
      sender: user.created,
      auto: true,
      content: JSON.stringify({
        title_site: nData3.param[user.language].title,
        content_site: `<span>${letter}</span>`,
      }),
    });
  }
};

// this function is called from getUrlParseData
exports.activateUserAccount = async (user) => {
  await UserVerify.deleteOne({ id: user.id, key: "email" });
  await MainUser.findOneAndUpdate(
    { id: user.id },
    { verify_email: true, notify_email: true, activated: true }
  );

  const logo = await SiteConfigs.findOne({ key: "logo" });
  const mailData = await EmailTemplateList.findOne({
    name: "welcomeregisterbonus",
  });
  const footerData = await EmailTemplateList.findOne({ name: "footer" });
  const lang = user.language || "en";
  const letter = mailData.param[lang] || mailData.param["en"];
  const footer = footerData.param[lang] || footerData.param["en"];

  letter.title = letter.title.split("<site>").join(serverConf.sitename);

  setTimeout(() => {
    baseController.sendEmail(
      user.email,
      {
        logo: `${serverConf.AdminUrl}${logo.value}`,
        site: serverConf.site,
        domain: `${serverConf.site}.com`,
        username: user.username,
        url1: `${serverConf.SiteUrl}/profile`,
        url2: `${serverConf.SiteUrl}/promotion`,
        url3: `${serverConf.SiteUrl}/casino`,
        url4: `${serverConf.SiteUrl}/profile?page=5`,
        data: letter,
        footer,
      },
      mailData.tid
    );
  }, 1000 * 60 * 1);
  this.sendFirstpartNotification(user);
};

exports.userActivateFromAdmin = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await MainUser.findOne({ _id: id });
    this.activateUserAccount(user);
    return res.status(200).send(true);
  } catch (error) {
    console.error({
      title: "userActivateFromAdmin",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Site Url Check (Activate accouont)
exports.getUrlParseData = async (req, res) => {
  try {
    let { token } = req.body;
    if (!token) {
      return res.status(400).send("Wrong Parameter");
    }

    token = token.split(" ").join("+");
    let decode = await baseController.decrypt(token);
    data = JSON.parse(decode);

    if (data.type == "activateaccount") {
      const user = await MainUser.findOne({ id: data.id });
      if (!user.activated) {
        const verifyData = await UserVerify.findOne({
          id: data.id,
          key: "email",
        });
        if (verifyData && verifyData.value == data.value) {
          this.activateUserAccount(user);
          const userHistoryData = await LogHistory.findOne({
            action: "REGISTER",
            userId: user.id,
          });
          if (userHistoryData && userHistoryData.clickid) {
            await baseController.axiosRequest(
              `https://xhsnc.rdtk.io/postback?clickid=${userHistoryData.clickid}&type=Reg`,
              {},
              "GET"
            );
          }
          return res.status(200).json({ type: "activateaccount", value: true });
        } else {
          return res
            .status(200)
            .json({ type: "activateaccount", value: false });
        }
      } else {
        return res.status(200).json({ type: "activateaccount", value: true });
      }
    } else {
      return res.status(200).send(false);
    }
  } catch (error) {
    console.error({
      title: "getUrlParseData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getLogHistoryStatusChild = async (ip) => {
  try {
    const resData = {};
    const date = new Date().valueOf() - 1000 * 60 * 10;
    const date1 = new Date().valueOf() - 1000 * 60 * 60 * 24;

    const logins = await LogAttemptHistory.find({
      ip,
      action: "LOGIN",
      createdAt: {
        $gte: date,
      },
    });

    if (
      logins.length &&
      logins[logins.length - 1].comment == "Successfully loggedIn"
    ) {
      resData.login = false;
    } else {
      const loginFailCount = logins.filter(
        (item) => item.comment != "Successfully loggedIn"
      );
      if (loginFailCount.length >= 3) {
        resData.login = true;
      }
    }

    const registers = await LogHistory.find({
      ip,
      action: "REGISTER",
      createdAt: {
        $gte: date1,
      },
    });
    if (registers.length) {
      resData.register = true;
    }

    return resData;
  } catch (error) {
    console.error({
      title: "getLogHistoryStatusChild",
      message: error.message,
      date: new Date(),
    });
    return { login: false, register: false };
  }
};

// Price List
exports.getPriceList = async (req, res) => {
  try {
    const data = await PriceConfig.findOne({ key: "price" });
    return res.status(200).json(data);
  } catch (error) {
    console.error({ title: "getPriceList", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

// Show Our site Payment List to payment page
exports.getAllGatewayListForPayment = async (req, res) => {
  try {
    const data = await PaymentList.aggregate([
      {
        $match: {
          status: true,
        },
      },
      {
        $sort: {
          paymentOrder: 1,
        },
      },
    ]);
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getAllGatewayListForPayment",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getPromotionTCList = async (req, res) => {
  try {
    const data = await BonusTaCList.find({ status: true });
    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getPromotionTCList",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
