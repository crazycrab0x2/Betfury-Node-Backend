const baseController = require("../controller/baseController");
const { UserSession, MainUser } = require("../models/index");
const serverConfig = require("../../serverConf");

exports.check_token = async (req, res, next) => {
  let token = req.headers.authorization;
  try {
    let sessionData = await UserSession.findOne({ token });
    let timestamp = await baseController.getTimestamp();
    if (sessionData) {
      if (
        sessionData.timestamp * 1 + serverConfig.session.expiretime <
        timestamp
      ) {
        await UserSession.findOneAndDelete({ token });
        return res.status(401).send("Session expired");
      } else {
        await UserSession.findOneAndUpdate(
          { token },
          { timestamp }
        );
        let userData = await MainUser.findOne({ _id: sessionData.id });
        req.user = userData;
        next();
      }
    } else {
      return res.status(401).send("Session expired");
    }
  } catch (e) {
    console.error({
      title: "sessionCheck",
      message: e.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.add_token = async (req, res, next) => {
  let token = req.headers.authorization;
  try {
    let sessionData = await UserSession.findOne({ token });
    let timestamp = await baseController.getTimestamp();
    if (sessionData) {
      if (
        sessionData.timestamp * 1 + serverConfig.session.expiretime <
        timestamp
      ) {
        next();
      } else {
        await UserSession.findOneAndUpdate({ token }, { timestamp });
        let userData = await MainUser.findOne({ _id: sessionData.id });
        req.user = userData;
        next();
      }
    } else {
      next();
    }
  } catch (e) {
    next();
  }
};
