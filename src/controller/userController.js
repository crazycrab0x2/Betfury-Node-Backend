const fs = require("fs");
const md5 = require("md5");
const uuidv4 = require("uuid");
const requestIp = require("request-ip");
const mongoose = require("mongoose");
const referralCodes = require("referral-codes");

const baseController = require("./baseController");

const {
  MainUser,
  UserSession,
  LogHistory,
  UserVerify,
  BonusArchive,
  BonusList,
  SiteConfigs,
  EmailTemplateList,
  NotifyTemplateList,
  NotificationList,
  AgentPermission,
} = require("../models");

const proConf = require("../config/provider");
const mainConf = require("../config/index");
const serverConf = require("../../serverConf");


// Password Update, Session History
exports.changePassword = async (req, res) => {
  try {
    const user = req.user;
    const {currentPassword, newPassword} = req.body;
    const userData = await MainUser.findOne({ id: user.id });
    const passwordVerify = await userData.comparePassword(currentPassword);
    if (!passwordVerify) {
      return res.status(200).send({
        status: "500",
        msg:"Invalid current password"
      });
    }
    const newpassword = await md5(newPassword);
    const new_user = await MainUser.findOneAndUpdate(
      { id: user.id },
      { password: newpassword },
      { returnDocument: 'after' }
    );
    if (new_user) {
      return res.status(200).send({
        status: "200",
        msg: "success",
        user: new_user
      });
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "setPassword",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Email Update, Session History
exports.changeEmail = async (req, res) => {
  try {
    const user = req.user;
    const {new_email, email_password} = req.body;
    const userData = await MainUser.findOne({ id: user.id });
    const passwordVerify = await userData.comparePassword(email_password);
    if (!passwordVerify) {
      return res.status(200).send({
        status: "500",
        msg:"Invalid current password"
      });
    }
    const new_user = await MainUser.findOneAndUpdate(
      { id: user.id },
      { email: new_email },
      { returnDocument: 'after' }
    );
    if (new_user) {
      return res.status(200).send({
        status: "200",
        msg: "success",
        user: new_user
      });
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "setPassword",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// username Update, Session History
exports.changeUsername = async (req, res) => {
  try {
    const user = req.user;
    const {new_username} = req.body;
    const existUser = await MainUser.findOne({ username: new_username });
    if(existUser){
      return res.status(200).send({
        status: "500",
        msg: "Username aleady exist!"
      });
    }
    const new_user = await MainUser.findOneAndUpdate(
      { id: user.id },
      { username: new_username },
      { returnDocument: 'after' }
    );
    if (new_user) {
      return res.status(200).send({
        status: "200",
        msg: "success",
        user: new_user
      });
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "setPassword",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Avatar Update, Session History
exports.changeAvatar = async (req, res) => {
  try {
    const user = req.user;
    const {currentPassword, newPassword} = req.body;
    const userData = await MainUser.findOne({ id: user.id });
    const passwordVerify = await userData.comparePassword(currentPassword);
    if (!passwordVerify) {
      return res.status(200).send({
        status: "500",
        msg:"Invalid current password"
      });
    }
    const newpassword = await md5(newPassword);
    const new_user = await MainUser.findOneAndUpdate(
      { id: user.id },
      { password: newpassword }
    );
    if (new_user) {
      return res.status(200).send({
        status: "200",
        msg: "success",
        user: new_user
      });
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "setPassword",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};




// Player Update Data
exports.playerProfileUpdate = async (req, res) => {
  try {
    const {
      id,
      firstname,
      lastname,
      username,
      phone,
      //  gender,
      birthday,
      country,
      state,
      city,
      postcode,
      street,
    } = req.body;

    const result = await MainUser.findOne({ _id: id });
    if (result) {
      const phoneUser = await MainUser.findOne({ phone });
      if (phoneUser && String(phoneUser.id) != String(id)) {
        return res.status(400).send("This mobile number exists");
      }
      const nameUser = await MainUser.findOne({ username });
      if (nameUser && String(nameUser.id) != String(id)) {
        return res.status(400).send("This username exists");
      }

      const updateData = {
        firstname,
        lastname,
        username,
        phone,
        //  gender,
        birthday,
        country,
        state,
        city,
        postcode,
        street,
      };
      if (phone != result.phone) {
        updateData.verify_sms = false;
        updateData.notify_sms = false;
      }

      const data = await MainUser.findOneAndUpdate({ _id: id }, updateData);
      if (data) {
        return res.status(200).send();
      } else {
        return res.status(500).send("Server Error");
      }
    } else {
      return res.status(400).send("Wrong Parameter");
    }
  } catch (error) {
    console.error({
      title: "playerProfileUpdate",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Verification Manage Part
exports.updateKycData = async (req, res) => {
  try {
    const user = req.user;
    const kyc_data = user.kyc_data;

    let type;

    if (req.files.length) {
      for (let i = 0; i < req.files.length; i++) {
        const filename = req.files[i].filename;
        const filetype =
          req.files[i].originalname.split(".")[
          req.files[i].originalname.split(".").length - 1
          ];
        const now_path = `${serverConf.BASEURL}image/site/kycData/${filename}`;
        const new_path = `${serverConf.BASEURL}image/site/kycData/${filename}.${filetype}`;
        type = req.files[i].fieldname.split("_")[1];
        kyc_data.push({
          type,
          name: req.files[i].originalname,
          url: "/image/site/kycData/" + filename + "." + filetype,
        });
        fs.rename(now_path, new_path, async (err) => { });
      }

      // This is send notification and email to user
      const nData = await NotifyTemplateList.findOne({
        name: "uploaddocument",
      });
      const lang = user.language || "en";
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
        let replace_title = "";
        if (type === "2") {
          replace_title = "Second"
        } else if (type === "3") {
          replace_title = "Third"
        } else {
          replace_title = "First"
        }
        let letter = nData.param[lang]
          ? nData.param[lang].letter
          : nData.param["en"].letter;
        letter = letter.split("<username>").join(`<b>${user.username}</b>`);
        let title = nData.param[user.language].title.split("First").join(replace_title);
        NotificationList.create({
          method: "site",
          receiver,
          sender: user.created,
          auto: true,
          content: JSON.stringify({
            title_site: title,
            content_site: `<span>${letter}</span>`,
          }),
        });
      }

      if (user.notify_email) {
        const mailData = await EmailTemplateList.findOne({
          name: "document_upload",
        });
        const footerData = await EmailTemplateList.findOne({ name: "footer" });
        const logo = await SiteConfigs.findOne({ key: "logo" });
        const letter = mailData.param[lang] || mailData.param["en"];
        const footer = footerData.param[lang] || footerData.param["en"];

        baseController.sendEmail(
          user.email,
          {
            logo: `${serverConf.AdminUrl}${logo.value}`,
            site: serverConf.site,
            domain: `${serverConf.site}.com`,
            username: user.username,
            url: serverConf.SiteUrl,
            data: letter,
            footer,
          },
          mailData.tid
        );
      }
    }

    if (type == "1") {
      await MainUser.findOneAndUpdate(
        { _id: user._id },
        { kyc_status: "pending" }
      );
    } else if (type == "2") {
      await MainUser.findOneAndUpdate(
        { _id: user._id },
        { add_status: "pending" }
      );
    } else if (type == "3") {
      await MainUser.findOneAndUpdate(
        { _id: user._id },
        { pay_status: "pending" }
      );
    }

    // This is for send notification to admin when first step verification request
    const adminUser = await MainUser.findOne({
      id: mainConf.USERS.superagent_user,
    });
    const nData1 = await NotifyTemplateList.findOne({ name: "vcount" });
    if (nData1 && adminUser.notify_site) {
      const vCount = await MainUser.countDocuments({
        $or: [
          { kyc_status: "pending" },
          { add_status: "pending" },
          { pay_status: "pending" },
        ],
      });
      const adminlang = adminUser.language || "en";
      let letter = nData1.param[adminlang]
        ? nData1.param[adminlang].message
        : nData1.param["en"].message;
      letter = letter.split("<username>").join(`<b>${adminUser.username}</b>`);
      letter = letter.split("<count>").join(`<b>${vCount}</b>`);

      const receiver = [
        {
          _id: String(adminUser._id),
          verify_email: adminUser.verify_email,
          verify_sms: adminUser.verify_sms,
          language: adminUser.language,
          email: adminUser.email,
          phone: adminUser.phone,
          name: adminUser.username,
          saw: false,
        },
      ];

      await NotificationList.findOneAndUpdate(
        { notifyid: nData1._id },
        {
          method: "site",
          receiver,
          sender: adminUser.created,
          auto: true,
          notifyid: nData1._id,
          content: JSON.stringify({
            title_site: nData1.param[adminUser.language].title,
            content_site: `<span>${letter}</span>`,
          }),
        },
        { upsert: true, new: true }
      );
    }

    let handle = await MainUser.findOneAndUpdate(
      { _id: user._id },
      { kyc_data }
    );
    if (handle) {
      return res.status(200).send();
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "updateKycData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.removeKycData = async (req, res) => {
  try {
    const data = req.body;
    if (!data.url) {
      return res.status(500).send("Wrong Parameter");
    }

    const user = req.user;
    const kyc_data = user.kyc_data;
    const newKyc = [];

    for (let i = 0; i < kyc_data.length; i++) {
      if (kyc_data[i].url != data.url) {
        newKyc.push(kyc_data[i]);
      } else {
        await fs.unlink(
          `${serverConf.BASEURL}${kyc_data[i].url}`,
          async (err) => { }
        );
      }
    }

    let handle = await MainUser.findOneAndUpdate(
      { _id: user._id },
      { kyc_data: newKyc }
    );
    if (handle) {
      return res.status(200).send();
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "removeKycData",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

exports.getSessionHistory = async (req, res) => {
  try {
    const { parsedFilter } = req.body;
    const userId = req.user.id;
    const count = await LogHistory.countDocuments({
      userId: mongoose.Types.ObjectId(userId),
    });
    const pages = await baseController.setPage(parsedFilter, count);

    const data = await LogHistory.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
        },
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
          // ip: "$ip",
          ip: "1.1.1.1",
          country: "$country",
          browser: "$browser",
          version: "$version",
          os: "$os",
          platform: "$platform",
          date: "$createdAt",
          action: "$action",
          comment: "$comment",
        },
      },
    ]);

    pages["skip1"] = data.length ? pages.skip + 1 : 0;
    pages["skip2"] = pages.skip + data.length;

    return res.status(200).json({ data, totalCount: count });
  } catch (error) {
    console.error({
      title: "getSessionHistory",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// Nickname Update Function
exports.updateNickName = async (req, res) => {
  try {
    let { nickname } = req.body;
    if (!nickname) {
      return res.status(400).send("Invalid Nickname");
    }
    let user = req.user;

    let nick_handle = await MainUser.findOne({ nickname });
    if (!nick_handle) {
      let handle = await MainUser.findOneAndUpdate(
        { _id: user._id },
        { nickname }
      );
      await UserSession.findOneAndUpdate({ id: user._id }, { nickname });
      if (handle) {
        return res.status(200).send("Success");
      } else {
        return res.status(500).send("Server Error");
      }
    } else {
      return res.status(500).send("This nickname exists");
    }
  } catch (error) {
    console.error({
      title: "updateNickName",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Update Language
exports.updateLanguage = async (req, res) => {
  try {
    if (req.body.lang) {
      const user = req.user;
      await MainUser.findOneAndUpdate(
        { _id: user.id },
        { language: req.body.lang }
      );
      return res.status(200).send();
    } else {
      return res.status(400).send("Wrong Parameter");
    }
  } catch (error) {
    console.error({
      title: "updateLanguage",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Privacy Policy Page
exports.sendNotificationSetting = async (req, res) => {
  try {
    const { notifySite, notifyEmail, notifySMS } = req.body;
    const user = req.user;

    if (notifyEmail && !user.verify_email) {
      return res.status(400).send("Please verify email first");
    }
    if (notifySMS && !user.verify_sms) {
      return res.status(400).send("please verify your mobile number first");
    }

    await MainUser.findOneAndUpdate(
      { id: user.id },
      {
        notify_site: notifySite,
        notify_email: notifyEmail,
        notify_sms: notifySMS,
      }
    );
    return res.status(200).send(true);
  } catch (error) {
    console.error({
      title: "sendNotificationSetting",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.sendVerifyEmailRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).send("Please input correct email");
    }

    const user = await MainUser.findOne({ email });
    if (user && String(user.id) != String(req.user.id)) {
      return res.status(400).send("This email exists");
    }

    await MainUser.findOneAndUpdate({ id: req.user.id }, { email });

    const referralCode = referralCodes.generate({ length: 6 });
    await UserVerify.findOneAndUpdate(
      { id: req.user.id, key: "email" },
      {
        id: req.user.id,
        key: "email",
        value: referralCode[0],
        timestamp: new Date().valueOf(),
      },
      { new: true, upsert: true }
    );

    const logo = await SiteConfigs.findOne({ key: "logo" });
    const mailData = await EmailTemplateList.findOne({ name: "emailverify" });
    const footerData = await EmailTemplateList.findOne({ name: "footer" });
    const lang = user.language || "en";
    const letter = mailData.param[lang] || mailData.param["en"];
    const footer = footerData.param[lang] || footerData.param["en"];

    const data = await baseController.sendEmail(
      email,
      {
        logo: `${serverConf.AdminUrl}${logo.value}`,
        site: serverConf.site,
        domain: `${serverConf.site}.com`,
        username: req.user.username,
        code: referralCode[0],
        url: `${serverConf.SiteUrl}?uri=verifyemail&email=${email}`,
        data: letter,
        footer,
      },
      mailData.tid
    );
    if (data) {
      return res.status(200).send(true);
    } else {
      return res.status(500).send("Please try again later");
    }
  } catch (error) {
    console.error({
      title: "sendVerifyEmailRequest",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.sendVerifySMSRequest = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).send("Please input correct mobile number");
    }

    const user = await MainUser.findOne({ phone });
    if (user && String(user.id) != String(req.user.id)) {
      return res.status(400).send("This mobile number exists");
    }

    await MainUser.findOneAndUpdate({ id: req.user.id }, { phone });

    const referralCode = referralCodes.generate({ length: 6 });
    await UserVerify.findOneAndUpdate(
      { id: req.user.id, key: "phone" },
      {
        id: req.user.id,
        key: "phone",
        value: referralCode[0],
        timestamp: Date.now(),
      },
      { new: true, upsert: true }
    );

    const data = await baseController.sendSMS(
      [phone],
      `Slotmaniax phone number verify code: ${referralCode[0]}`
    );

    if (data) {
      return res.status(200).send(true);
    } else {
      return res.status(500).send("Please try again later");
    }
  } catch (error) {
    console.error({
      title: "sendVerifySMSRequest",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.sendVerifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!code) {
      return res.status(400).send("Please input correct code");
    }
    const user = await MainUser.findOne({ email });
    if (!user) {
      return res.status(400).send("Wrong email");
    }

    const flag = await UserVerify.findOne({ id: user.id, key: "email" });
    if (
      new Date(flag.timestamp).valueOf() + 15 * 60 * 1000 <
      new Date().valueOf()
    ) {
      await UserVerify.deleteOne({ id: user.id, key: "email" });
      return res.status(400).send("expired code. please try again");
    }

    if (code != flag.value) {
      return res.status(400).send("Wrong code");
    } else {
      await UserVerify.deleteOne({ id: user.id, key: "email" });
      await MainUser.findOneAndUpdate({ email }, { verify_email: true });
      return res.status(200).send(true);
    }
  } catch (error) {
    console.error({
      title: "sendVerifyEmailCode",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.SmsBonusUpdateContinue = async (user, smsBonus, ip, phone) => {
  const otherBonuses = await BonusArchive.find({
    userId: user.id,
    $or: [{ status: "awarded" }, { status: "waiting" }],
  });

  if (otherBonuses.length) {
    await BonusArchive.create({
      userId: user.id,
      bonusId: smsBonus.bonusId,
      status: "waiting",
      detail: { ip },
    });
  } else {
    const TID1 = uuidv4.v4();
    const Hash1 = md5(
      `User/PhoneVerify/${proConf.SOFTGAM.IP}/${TID1}/${proConf.SOFTGAM.APIKEY}/${serverConf.prefix}_${user.nickname}_${user.dis_currency}/${user.nickname}/${proConf.SOFTGAM.APIPASS}`
    );
    const softgamBonus = await baseController.axiosRequest(
      `${proConf.SOFTGAM.ENDPOINT}System/Api/${proConf.SOFTGAM.APIKEY}/User/PhoneVerify/?&Login=${serverConf.prefix}_${user.nickname}_${user.dis_currency}&Password=${user.nickname}` +
      `&Phone=${phone}&TID=${TID1}&Hash=${Hash1}`,
      {},
      "POST"
    );

    if (softgamBonus == "1,Phone verified") {
      await BonusArchive.create({
        userId: user.id,
        bonusId: smsBonus.bonusId,
        status: "awarded",
        detail: {},
      });
      baseController.axiosRequest(
        `${serverConf.apiUrl}/api/getFundistBonusData`,
        { id: user.id },
        "POST"
      );

      const nData = await NotifyTemplateList.findOne({
        name: "giveverifybonus",
      });
      if (nData && user.notify_site) {
        const lang = user.language || "en";
        let letter = nData.param[lang]
          ? nData.param[lang].letter
          : nData.param["en"].letter;
        letter = letter.split("<username>").join(`<b>${user.username}</b>`);

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
    }
  }
};

exports.sendVerifySMSCode = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const ip = requestIp.getClientIp(req);

    if (!code) {
      return res.status(400).send("Please input correct code");
    }
    const user = await MainUser.findOne({ phone });
    if (!user) {
      return res.status(400).send("Please finish kyc verification");
    }

    const flag = await UserVerify.findOne({ id: user.id, key: "phone" });
    if (!flag) {
      return res.status(400).send("Something went wrong");
    }

    if (
      new Date(flag.timestamp).valueOf() + 15 * 60 * 1000 <
      new Date().valueOf()
    ) {
      await UserVerify.deleteOne({ id: user.id, key: "phone" });
      return res.status(400).send("expired code. please try again");
    }

    if (code != flag.value) {
      return res.status(400).send("wrong code");
    } else {
      await UserVerify.deleteOne({ id: user.id, key: "phone" });
      const userData = await MainUser.findOneAndUpdate(
        { phone },
        { verify_sms: true, notify_sms: true }
      );
      const agentUser = await AgentPermission.findOne({ id: userData.created });
      if (agentUser && agentUser.useBonus) {
        const smsBonus = await BonusList.findOne({ key: "SMS" });
        if (smsBonus) {
          const data = await BonusArchive.findOne({
            userId: user.id,
            bonusId: smsBonus.bonusId,
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
              this.SmsBonusUpdateContinue(user, smsBonus, ip, phone);
            } else {
              this.SmsBonusUpdateContinue(user, smsBonus, ip, phone);
            }
          }
        }
      }
      return res.status(200).send(true);
    }
  } catch (error) {
    console.error({
      title: "sendVerifySMSCode",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

//  ------------------------------------------------------------------

// Forgot Password Request
exports.forgotPasswordRequest = async (req, res) => {
  try {
    const { value, type, send } = req.body;
    if (!value) {
      return res.status(400).send(`Please input correct ${type}`);
    }

    let user;
    if (type == "Email") {
      user = await MainUser.findOne({ email: value });
    } else {
      user = await MainUser.findOne({ phone: value });
    }
    if (!user) {
      return res.status(400).send(`No account with this ${type}`);
    }

    const ip = requestIp.getClientIp(req);
    const country = await baseController.getUserCountry(ip, "IT");

    const historyData = {
      ip,
      country,
      browser: req.useragent.browser,
      version: req.useragent.version,
      os: req.useragent.os,
      platform: req.useragent.platform,
    };

    const referralCode = referralCodes.generate({ length: 6 });
    const newpassword = await md5(referralCode[0]);

    await MainUser.findOneAndUpdate({ id: user.id }, { password: newpassword });

    historyData.userId = user.id;
    historyData.comment = `password reset ${send}={password=>referralCode[0]}`;
    historyData.action = "RESET PASSWORD";
    await new LogHistory(historyData).save();

    const nData = await NotifyTemplateList.findOne({ name: "passwordreset" });
    if (nData) {
      const lang = user.language || "en";
      let letter = nData.param[lang]
        ? nData.param[lang].letter
        : nData.param["en"].letter;
      letter = letter.split("<username>").join(`<b>${user.username}</b>`);
      letter = letter
        .split("<>")
        .join(`<a href="${serverConf.SiteUrl}/profile?page=2">`);
      letter = letter.split("</>").join(`</a>`);

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

    if (type == "Email") {
      const logo = await SiteConfigs.findOne({ key: "logo" });
      const mailData = await EmailTemplateList.findOne({
        name: "forgotpassword",
      });
      const footerData = await EmailTemplateList.findOne({ name: "footer" });
      const lang = user.language || "en";
      const letter = mailData.param[lang] || mailData.param["en"];
      const footer = footerData.param[lang] || footerData.param["en"];

      const data = await baseController.sendEmail(
        value,
        {
          logo: `${serverConf.AdminUrl}${logo.value}`,
          name: user.username,
          code: referralCode[0],
          url: `${serverConf.SiteUrl}?uri=signin&email=${user.email}`,
          site: serverConf.site,
          domain: `${serverConf.site}.com`,
          data: letter,
          footer,
        },
        mailData.tid
      );
      if (data) {
        return res.status(200).send(true);
      } else {
        return res.status(500).send("Please try again later");
      }
    } else {
      const data = await baseController.sendSMS(
        [value],
        `Reseted password: ${referralCode[0]}`
      );
      if (data) {
        return res.status(200).send(true);
      } else {
        return res.status(500).send("Please try again later");
      }
    }
  } catch (error) {
    console.error({
      title: "forgotPasswordRequest",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Resent Account Activation
exports.resendAccountActivateEmail = async (req, res) => {
  try {
    const user = req.user;
    const { email } = req.body;

    const referralCode = referralCodes.generate({ length: 6 });
    await UserVerify.findOneAndUpdate(
      { id: user._id, key: "email" },
      {
        id: user._id,
        key: "email",
        value: referralCode[0],
        timestamp: new Date().valueOf(),
      },
      { new: true, upsert: true }
    );

    const keyData = await baseController.encrypt(
      JSON.stringify({
        id: user._id,
        value: referralCode[0],
        type: "activateaccount",
      })
    );

    let sendMail = user.email;
    if (email) {
      const flag = await MainUser.findOne({ email });
      if (!flag) {
        await MainUser.findOneAndUpdate({ id: user.id }, { email });
        sendMail = email;
      } else {
        return res.status(400).send("This email exists");
      }
    }

    const terms = await SiteConfigs.findOne({ key: "terms" });
    const logo = await SiteConfigs.findOne({ key: "logo" });
    const footerData = await EmailTemplateList.findOne({ name: "footer" });
    const mailData = await EmailTemplateList.findOne({
      name: "activateaccount",
    });
    const lang = user.language || "en";
    const letter = mailData.param[lang] || mailData.param["en"];
    const footer = footerData.param[lang] || footerData.param["en"];

    await baseController.sendEmail(
      sendMail,
      {
        logo: `${serverConf.AdminUrl}${logo.value}`,
        site: serverConf.site,
        domain: `${serverConf.site}.com`,
        term: `${serverConf.AdminUrl}${terms.value}`,
        username: user.username,
        verifyUrl: `${serverConf.SiteUrl}?token=${keyData}`,
        data: letter,
        footer,
      },
      mailData.tid
    );

    return res.status(200).send(true);
  } catch (error) {
    console.error({
      title: "resendAccountActivateEmail",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Player Currency Update
exports.updatePlayerCurrency = async (req, res) => {
  try {
    const user = req.user;
    const { currency } = req.body;
    if (currency) {
      const flag = await MainUser.findOneAndUpdate(
        { id: user.id },
        { currency }
      );
      // const flag = await MainUser.findOneAndUpdate({ id: user.id }, { currency, dis_currency: currency })
      if (flag) {
        return res.status(200).send();
      } else {
        return res.status(500).send("Server Error");
      }
    } else {
      return res.status(400).send("Wrong Parameter");
    }
  } catch (error) {
    console.error({
      title: "updatePlayerCurrency",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// HideZero Option
exports.updateHidezero = async (req, res) => {
  try {
    const user = req.user;
    const { hidezero } = req.body;
    const flag = await MainUser.findOneAndUpdate({ id: user.id }, { hidezero });
    if (flag) {
      return res.status(200).json();
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "updateHidezero",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Add Currency to User
exports.addPlayerCurrency = async (req, res) => {
  try {
    const user = req.user;
    const { currency } = req.body;
    if (currency) {
      const updatedData = {
        ...user.balance,
        [currency]: 0,
      };
      const flag = await MainUser.findOneAndUpdate(
        { id: user.id },
        { balance: updatedData }
      );
      if (flag) {
        return res.status(200).json();
      } else {
        return res.status(500).send("Server Error");
      }
    } else {
      return res.status(400).send("Wrong Parameter");
    }
  } catch (error) {
    console.error({
      title: "addPlayerCurrency",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Update Dis currency Of User
exports.updateDisCurrency = async (req, res) => {
  try {
    const user = req.user;
    const { dis_currency } = req.body;
    const flag = await MainUser.findOneAndUpdate(
      { id: user.id },
      { dis_currency }
    );
    if (flag) {
      return res.status(200).json();
    } else {
      return res.status(500).send("Server Error");
    }
  } catch (error) {
    console.error({
      title: "updateDisCurrency",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
