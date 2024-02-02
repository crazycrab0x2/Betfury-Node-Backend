const md5 = require("md5");
const moment = require("moment-timezone");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const CryptoJS = require("crypto-js");
const cryptoObj = require("crypto");
const { Recaptcha } = require("recaptcha-v2");
const CronJob = require('cron').CronJob;

const { CurrencyList, IpAPIHistory, MainUser } = require("../models/index");

const serverConfig = require("../../serverConf");
const providerConf = require("../config/provider");

sgMail.setApiKey(providerConf.SendGrid.apikey);

let currencyData = [];

const init = async () => {
  currencyData = await CurrencyList.find({ status: true });
  setInterval(async () => {
    currencyData = await CurrencyList.find({ status: true });
  }, 1000 * 60 * 60 * 24);
};
init();

exports.RtFixedCount = (num, count) => {
  const re = new RegExp("^-?\\d+(?:.\\d{0," + (count || -1) + "})?");
  let changeNum = num;
  if (num < 0.000001) {
    changeNum = num ? num.toFixed(count) : 0;
    if (Number(changeNum) === 0.000001) {
      changeNum = 0;
    }
  }
  const ree = changeNum.toString().match(re)[0];
  const reee = Number(ree).toFixed(count);
  return Number(reee);
};

exports.getAmount = (currency, amount) => {
  const oneCurrency = currencyData.find((item) => item.currency == currency);
  if (oneCurrency.type == "crypto") {
    return this.RtFixedCount(amount, 6);
  } else {
    return this.RtFixedCount(amount, 2);
  }
};

exports.getTimestamp = () => {
  return new Date().valueOf();
};

exports.encrypt = (text) => {
  try {
    const ciphertext = CryptoJS.AES.encrypt(
      text,
      serverConfig.JTW_KEY
    ).toString();
    return `${ciphertext}`;
  } catch (err) {
    console.error({
      title: "encrypt",
      message: err.message,
      time: new Date(),
      file: __filename,
      params: { text, key: serverConfig.JTW_KEY },
    });
  }
};

exports.decrypt = (hash) => {
  try {
    const bytes = CryptoJS.AES.decrypt(hash, serverConfig.JTW_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (err) {
    console.error({
      title: "decrypt",
      message: err.message,
      time: new Date(),
      file: __filename,
      params: { hash, key: serverConfig.JTW_KEY },
    });
  }
};

exports.axiosRequest = async (url, data = {}, method, headers, auth) => {
  return new Promise((resolve, reject) => {
    let options = {
      method,
      url,
      data,
    };
    if (auth) {
      options.auth = auth;
    }
    if (headers) {
      options.headers = headers;
    }

    axios(options)
      .then((res) => {
        return resolve(res.data);
      })
      .catch((err) => {
        return resolve(err);
      });
  });
};

exports.setPage = (params, totalcount) => {
  const { page, perPage } = params;
  const newparams = {};
  let totalPages;
  if (page !== undefined && perPage !== undefined) {
    totalPages = Math.ceil(totalcount / perPage);
    const calculatedPage = (page - 1) * perPage;
    if (calculatedPage > totalcount) {
      newparams["page"] = 1;
      newparams["perPage"] = parseInt(perPage);
    } else {
      newparams["perPage"] = parseInt(perPage);
      newparams["page"] = parseInt(page);
    }
  } else {
    totalPages = Math.ceil(totalcount / 10);
    newparams["page"] = 1;
    newparams["perPage"] = 10;
  }

  const index1 = newparams.page == 0 ? 0 : newparams.page - 1;
  const index2 = newparams.page == 0 ? 1 : newparams.page;
  const skip = index1 * newparams.perPage;
  const limit = index2 * newparams.perPage;

  return {
    totalPages,
    skip,
    limit,
  };
};

exports.verifyCapcha = async (response) => {
  return new Promise((resolve) => {
    const recaptcha = new Recaptcha(
      serverConfig.capchaKey[serverConfig.SiteUrl].SITEKEY,
      serverConfig.capchaKey[serverConfig.SiteUrl].SECRETKEY,
      {
        response,
        secret: serverConfig.capchaKey[serverConfig.SiteUrl].SECRETKEY,
      }
    );
    recaptcha.verify((success) => {
      if (success) {
        return resolve(true);
      }
      setTimeout(() => {
        return resolve(false);
      }, 2000);
    });
  });
};

exports.praxisSign = async (obj) => {
  const concatenated_data =
    obj.merchant_id +
    obj.application_key +
    obj.timestamp +
    obj.intent +
    obj.cid +
    obj.order_id +
    providerConf.Praxis.PrivateKey;
  const hash = cryptoObj.createHash("sha384");
  const signature = hash.update(concatenated_data, "utf-8").digest("hex");
  return signature;
};

exports.get_stand_date_end = (date) => {
  return new Date(moment(new Date(date)).format("YYYY-MM-DD HH:mm"));
};

exports.getUserCountry = async (ip, country) => {
  try {
    if (ip == "::1") return country;
    const data = await this.axiosRequest(
      // `https://pro.ip-api.com/json/${ip}?key=${providerConf.IPAPI.key}`,
      `http://ip-api.com/json/${ip}`,
      {},
      "GET"
    );
    await IpAPIHistory.create({ site: serverConfig.SiteUrl, ip });
    if (data) {
      return data.countryCode;
    } else {
      return country;
    }
  } catch (error) {
    return country;
  }
};

exports.getUserData = async (ip) => {
  try {
    const data = await this.axiosRequest(
      `https://pro.ip-api.com/json/${ip}?key=${providerConf.IPAPI.key}`,
      {},
      "GET"
    );
    await IpAPIHistory.create({ site: serverConfig.SiteUrl, ip });
    if (data) {
      return data;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

exports.sendEmail = (email, dynamicTemplateData, template_id) => {
  return new Promise((resolve) => {
    const msg = {
      from: providerConf.SendGrid.from,
      personalizations: [
        {
          to: [
            {
              email,
            },
          ],
          dynamicTemplateData,
        },
      ],
      template_id,
    };
    sgMail
      .send(msg)
      .then((response) => {
        resolve(true);
      })
      .catch((error) => {
        resolve(false);
      });
  });
};

exports.sendSMS = (phones, message) => {
  return new Promise((resolve) => {
    const sendphones = [];
    for (let i = 0; i < phones.length; i++) {
      sendphones.push({ msisdn: phones[i] });
    }
    const payload = {
      sender: providerConf.GetewaySMS.from,
      message,
      recipients: sendphones,
    };

    const encodedAuth = Buffer.from(
      `${providerConf.GetewaySMS.apikey}:`
    ).toString("base64");

    axios
      .post(providerConf.GetewaySMS.url, payload, {
        headers: {
          Authorization: `Basic ${encodedAuth}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        resolve(true);
      })
      .catch((err) => {
        resolve(false);
      });
  });
};

exports.addBonusBlock = async (nickname, currency, TID = false) => {
  try {
    let blockId = 2836;

    if (providerConf.SOFTGAM.APIKEY == "4e8a6f7ceae42f831e65ba944e3845c9") {
      blockId = 9500;
    }

    let realTid = TID ? TID : new Date().valueOf().toString();

    const Hash1 = md5(
      `User/SetTags/${providerConf.SOFTGAM.IP}/${realTid}/${providerConf.SOFTGAM.APIKEY}/${serverConfig.prefix}_${nickname}_${currency}/${providerConf.SOFTGAM.APIPASS}`
    );
    const url = `${providerConf.SOFTGAM.ENDPOINT}System/Api/${providerConf.SOFTGAM.APIKEY}/User/SetTags/?&Login=${serverConfig.prefix}_${nickname}_${currency}&IDTags[]=${blockId}&TID=${realTid}&Hash=${Hash1}`;
    const flag = await axios.post(url, {});

    if (flag.data == "1,Ok") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Node Cron for Account block Duration
exports.accountBlockCron = async (sec, min, hour, date, month, userId) => {
  const job = new CronJob(`${sec} ${min} ${hour} ${date} ${month} *`, async () => {
    console.log("blockCron started!")
    await MainUser.findOneAndUpdate(
      { _id: userId },
      {
        block_duration: null,
        status: "allow"
      },
      { new: true, upsert: true }
    )
    job.stop();
  }, null, true);
  job.start();
}

// exports.sendEmailBrevo = async () => {
//     var SibApiV3Sdk = require('sib-api-v3-sdk');
//     var defaultClient = SibApiV3Sdk.ApiClient.instance;

//     // Configure API key authorization: api-key
//     var apiKey = defaultClient.authentications['api-key'];
//     apiKey.apiKey = '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';

//     // Uncomment below two lines to configure authorization using: partner-key
//     var partnerKey = defaultClient.authentications['partner-key'];
//     partnerKey.apiKey = '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';

//     var apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

//     var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email

//     sendSmtpEmail = {
//         to: [{
//             email: 'gombau1212@gmail.com',
//             name: 'Lucas Daniel'
//         }],
//         templateId: 1,
//         params: {
//             name: 'Lucas',
//             surname: 'Daniel'
//         },
//         headers: {
//             'X-Mailin-custom': 'custom_header_1:custom_value_1|custom_header_2:custom_value_2'
//         }
//     };

//     apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
//         console.log('API called successfully. Returned data: ' + data.data);
//     }, function (error) {
//         console.error(error);
//     });
// }
