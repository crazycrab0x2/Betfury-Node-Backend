const requestIp = require("request-ip");
const referralCodes = require("referral-codes");

const baseController = require("./baseController");
const configController = require("./configController");
const crypto = require("crypto");

const {
  MainUser,
  LogHistory,
  UserSession,
  SiteConfigs,
  BlockIPs,
  LogAttemptHistory,
  EmailTemplateList,
  UserVerify,
} = require("../models");

const mainConfig = require("../config");
const serverConf = require("../../serverConf");

// Authentication Part

exports.sessionCheck = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.error({
      title: "sessionCheck",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await MainUser.findOne({
      $or: [{ email }, { username: email }],
    });
    if (!userData) {
      return res.status(400).send("Email is not found");
    }

    const passwordVerify = await userData.comparePassword(password);
    if (passwordVerify) {
      const timestamp = await baseController.getTimestamp();
      const payload = {
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        timestamp,
      };
      const token = await baseController.encrypt(JSON.stringify(payload));
      if (token) {
        const saveData = {
          id: userData._id,
          email: userData.email,
          username: userData.username,
          token,
          hash: crypto.createHash("sha1").update(token).digest("hex"),
          timestamp,
        };
        const handle = await UserSession.findOneAndUpdate(
          { id: userData._id },
          saveData,
          { new: true, upsert: true }
        );
        if (handle) {
          return res.status(200).json({ token, user: userData, message: "Success" });
        } else {
          return res.status(500).send("Server Error");
        }
      } else {
        return res.status(500).send("Server Error");
      }
    } else {
      return res.status(400).send("Please input correct password");
    }
  } catch (error) {
    console.error({
      title: "userLogin",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.userRegister = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const email_verify_status = await MainUser.findOne({ email });
    if (email_verify_status) {
      return res.status(400).send("This email exists");
    }

    const username_verify_status = await MainUser.findOne({ username });
    if (username_verify_status) {
      return res.status(400).send("This username exists");
    }

    const userData = {
      email,
      username,
      password,
      create_date: new Date().valueOf(),
    };
    const saved = await new MainUser(userData).save();
    if (saved) {
      const timestamp = await baseController.getTimestamp();
      const payload = {
        _id: saved._id,
        username: saved.username,
        email: saved.email,
        password: saved.password,
        timestamp,
      }
      const token = await baseController.encrypt(JSON.stringify(payload));
      if (token) {
        const saveData = {
          id: saved._id,
          email: saved.email,
          username: saved.username,
          token,
          hash: crypto.createHash("sha1").update(token).digest("hex"),
          timestamp,
        };
        const handle = await UserSession.findOneAndUpdate(
          { id: saved._id },
          saveData,
          { new: true, upsert: true }
        );
        if (handle) {
          return res.status(200).json({ token, user: saved, message: "Success" });
        } else {
          return res.status(500).send("Server Error");
        }
      } else {
        return res.status(500).send("Server Error");
      }
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "userRegister",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.userLogout = async (req, res) => {
  try {
    const userData = req.user;
    await UserSession.findOneAndDelete({ id: userData._id });
    return res.status(200).send();
  } catch (error) {
    console.error({
      title: "userLogout",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
