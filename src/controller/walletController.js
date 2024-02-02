const uuidv4 = require("uuid");
const mongoose = require("mongoose");
const requestIp = require("request-ip");

const baseController = require("./baseController");
const bonusController = require("./bonusController");

const {
  MainUser,
  PaymentList,
  BalanceHistory,
  BonusArchive,
  PaymentPermissionList,
  EmailTemplateList,
  SiteConfigs,
  PaymentInfo,
  PriceConfig,
  NotifyTemplateList,
  NotificationList,
} = require("../models");

const mainConfig = require("../config");
const ProConf = require("../config/provider");
const tblConfig = require("../config/tablemanage");
const servConf = require("../../serverConf");
const serverConf = require("../../serverConf");

// getAvailableCurrencies
exports.getAvailableCurrencies = async (req, res) => {
  const currencyDetailes = await baseController.axiosRequest(
    `${serverConf.wallet.nowpayment_endpoint}/full-currencies`,
    {},
    "GET",
    { "X-Api-Key": serverConf.wallet.nowpayment_api_key },
  );
  const allowedCredentials = await baseController.axiosRequest(
    `${serverConf.wallet.nowpayment_endpoint}/merchant/coins`,
    {},
    "GET",
    { "X-Api-Key": serverConf.wallet.nowpayment_api_key },
  );
  const result = currencyDetailes["currencies"].filter(currency => allowedCredentials["selectedCurrencies"].includes(currency.code));
  return res.status(200).json(result);
}

// getCurrencyData
exports.getMinimumDepositAmount = async (req, res) => {
  const { currency } = req.body;
  const minAmount = await baseController.axiosRequest(
    `${serverConf.wallet.nowpayment_endpoint}/min-amount?currency_from=${currency}`,
    {},
    "GET",
    { "X-Api-Key": serverConf.wallet.nowpayment_api_key },
  );
  return res.status(200).json(minAmount.min_amount);
}

// getCurrencyData
exports.getMinimumWithdrawAmount = async (req, res) => {
  const { currency } = req.body;
  const minAmount = await baseController.axiosRequest(
    `${serverConf.wallet.nowpayment_endpoint}/payout-withdrawal/min-amount/${currency}`,
    {},
    "GET",
    { "X-Api-Key": serverConf.wallet.nowpayment_api_key },
  );
  if (minAmount.response) 
    return res.status(200).json({status: "500", msg: minAmount.response.data.message });
  else if(minAmount.success)
    return res.status(200).json({status: "200", data: minAmount.result });
  else
    return res.status(200).json({status: "500", data: minAmount.error });
}

//crypto deposit
exports.deposit = async (req, res) => {
  const { currency, amount } = req.body;
  console.log(currency, amount)
  const user = req.user;

  const depositData = await baseController.axiosRequest(
    `${serverConf.wallet.nowpayment_endpoint}/payment`,
    {
      price_amount: amount,
      price_currency: currency,
      pay_currency: currency,
      ipn_callback_url:
        "https://stage.europa777.com/api/wallet/nowpaymentCallback",
      order_id: `deposit_${user.username}_${amount}_${currency}`,
    },
    "POST",
    { "X-Api-Key": serverConf.wallet.nowpayment_api_key }
  );
  if (depositData.response) {
    return res.status(200).json({
      status: "500",
      msg: depositData.response.data.message,
      data: depositData,
    });
  } else {
    const newBalanceTransaction = {
      userid: user._id,
      amount,
      amountType: "crypto",
      paymentType: "deposit",
      paymentMethod: `crypto_${currency}`,
      payAddress: depositData.pay_address,
      transactionId: `nowpayment-${depositData.payment_id}`,
      lastbalance: user.balance[currency] ? user.balance[currency] : 0,
      newbalance: user.balance[currency] ? user.balance[currency] : 0,
      comment: `deposit_${amount}_${currency}`,
      currency: currency,
      status: "waiting",
    };
    await BalanceHistory(newBalanceTransaction).save();
    return res.status(200).json({ status: "200", data: depositData });
  }
};

//nowpayment callback endpoint
exports.nowpaymentCallback = async (req, res) => {
  const {
    payment_id,
    payment_status,
    price_amount,
    price_currency,
    outcome_amount,
    outcome_currency,
  } = req.body;
  console.log(req.app?.get, "req.app====>nowpayment")
  const transaction = await BalanceHistory.findOneAndUpdate(
    { transactionId: `nowpayment-${payment_id}` },
    { status: payment_status, new: true, upsert: true }
  );
  const user = await MainUser.findOne({ _id: transaction.userid });
  const currency = price_currency.toUpperCase();
  if (payment_status == "finished") {
    await bonusController.bonusHandle(user, currency, price_amount, req);
  } else if (payment_status == "partially_paid") {
    const nowpay_endpoint_url = `${serverConf.wallet.nowpayment_endpoint}/estimate?amount=${outcome_amount}&currency_from=${outcome_currency}&currency_to=${price_currency}`;
    const estimatedPrice = await baseController.axiosRequest(
      nowpay_endpoint_url,
      {},
      "GET",
      { "X-Api-Key": serverConf.wallet.nowpayment_api_key }
    );
    await bonusController.bonusHandle(
      user,
      currency,
      estimatedPrice.estimated_amount,
      req,
    );
  }
  //notification
};

exports.withdraw = async (req, res) => {
  const { address, currency, amount } = req.body;
  const user = req.user;
  const currencyValidation = await baseController.axiosRequest(
    `${serverConf.wallet.nowpayment_endpoint}/payout/validate-address`,
    {
      address,
      currency
    },
    "POST",
    { "X-Api-Key": serverConf.wallet.nowpayment_api_key },
  );
  if (currencyValidation.response) {
    return res.status(200).json({
      status: "500",
      msg: currencyDetailes.response.data.message,
    });
  } else {
    return res.status(200).json({
      status: "200",
      data: result,
    });
  }
}

exports.getTransactionHistory = async (req, res) => {
  const { perPage, pageNumber } = req.body;
  const user = req.user;
  const result = await BalanceHistory.find({userid: user._id});
  return res.status(200).json(result);
}

// Save current price to database (it is from api backend)
exports.setPriceList = async (req, res) => {
  try {
    const priceData = req.body;
    await PriceConfig.findOneAndUpdate(
      {
        key: "price",
      },
      {
        key: "price",
        data: priceData,
      },
      {
        new: true,
        upsert: true,
      }
    );

    const io = req.app.get("socketio");
    io.sockets.emit("price", priceData);

    return res.status(200).send();
  } catch (error) {
    console.error({ title: "setPriceList", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

// This is for show available Gateway show for this user
exports.getGatewayList = async (req, res) => {
  try {
    const { type } = req.body;
    const user = req.user;

    const ip = requestIp.getClientIp(req);
    const country = await baseController.getUserCountry(ip, "IT");

    const payPermission = await PaymentPermissionList.findOne({
      userid: user.created,
    });
    const sendData = [];
    const gatewayIds = [];

    if (payPermission) {
      for (let i in payPermission.gatewayData) {
        if (
          i != "system-d" &&
          i != "system-w" &&
          payPermission.gatewayData[i]
        ) {
          gatewayIds.push(mongoose.Types.ObjectId(i));
        }
      }
      const data = await PaymentList.find({
        status: true,
        type,
        _id: {
          $in: gatewayIds,
        },
      });

      for (let i = 0; i < data.length; i++) {
        // if (data[i].country.includes(country) && data[i].currencyData.findIndex(item => item.currency == user.currency) > -1) {
        if (
          data[i].currencyData.findIndex(
            (item) => item.currency == user.currency
          ) > -1
        ) {
          sendData.push(data[i]);
        }
      }

      return res.status(200).json(sendData);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error({
      title: "getGatewayList",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

// Transaction Detail Page
exports.getAllGatewayList = async (req, res) => {
  try {
    const providerList = await PaymentList.aggregate([
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
      {
        $project: {
          label: "$name",
          comment: "$comment",
          value: "$_id",
        },
      },
    ]);

    const data = [
      { label: "All", value: "" },
      { label: "Bonus", value: "bonus" },
      { label: "System", value: "system" },
    ];

    for (let i in providerList) {
      data.push({
        label: `${providerList[i].label} (${providerList[i].comment})`,
        value: providerList[i].value,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error({
      title: "getAllGatewayList",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getTransactionHistory1 = async (req, res) => {
  try {
    let { parsedFilter, condition } = req.body;

    if (
      new Date(condition.date[1]).valueOf() -
      new Date(condition.date[0]).valueOf() >=
      1000 * 3600 * 24 * 62
    ) {
      return res.status(500).send("Please select duration below 2 months");
    }

    let newCondition = await this.getMySearchDataOfTR(condition, req.user);
    let totalDWData = await this.getTotalDataOfTR(newCondition);
    let count = await BalanceHistory.countDocuments(newCondition);
    let pages = await baseController.setPage(parsedFilter, count);

    let data = await BalanceHistory.aggregate([
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
          localField: "userid",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          paymentType: "$paymentType",
          paymentMethod: "$paymentMethod",
          amount: "$amount",
          currency: "$currency",
          lastbalance: "$lastbalance",
          updatedbalance: "$updatedbalance",
          transactionId: "$transactionId",
          createdAt: "$createdAt",
          status: "$status",
        },
      },
    ]);

    pages["skip1"] = data.length ? pages.skip + 1 : 0;
    pages["skip2"] = pages.skip + data.length;
    return res.status(200).json({ data, totalCount: count, totalDWData });
  } catch (error) {
    console.error({
      title: "getMyTransactionList",
      error,
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.getTotalDataOfTR = async (newCondition) => {
  let totalData = await BalanceHistory.aggregate([
    {
      $match: {
        ...newCondition,
        status: "success",
      },
    },
    {
      $group: {
        _id: {
          paymentType: "$paymentType",
          currency: "$currency",
        },
        amount: {
          $sum: "$amount",
        },
      },
    },
    {
      $group: {
        _id: "$_id.currency",
        data: {
          $push: {
            paymentType: "$_id.paymentType",
            amount: "$amount",
          },
        },
      },
    },
  ]);

  return totalData;
};

exports.getMySearchDataOfTR = async (condition, user) => {
  let start = await baseController.get_stand_date_end(condition.date[0]);
  let end = await baseController.get_stand_date_end(condition.date[1]);
  let newCondition = { $and: [{ createdAt: { $gte: start, $lte: end } }] };

  if (condition.paymentType)
    newCondition["$and"].push({ paymentType: condition.paymentType });
  if (condition.paymentOption)
    newCondition["$and"].push({ paymentMethod: condition.paymentOption });
  if (condition.status) newCondition["$and"].push({ status: condition.status });
  if (condition.tid)
    newCondition["$and"].push({
      transactionId: { $regex: condition.tid, $options: "i" },
    });

  let parent = await MainUser.findOne({ id: user.created });

  newCondition["$and"].push({
    userid: mongoose.Types.ObjectId(user.id),
    relateUser: mongoose.Types.ObjectId(parent.id),
  });

  return newCondition;
};

//  ------------------------------------------------------------------

// These functions are for manage user's saved bank data
exports.getCardData = async (req, res) => {
  try {
    const user = req.user;
    const data = await PaymentInfo.find({ userid: user.id });
    return res.status(200).json(data);
  } catch (error) {
    console.error({ title: "getCardData", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

exports.saveCardInfo = async (userid, gateway, paymentData) => {
  const info = await PaymentInfo.findOne({ userid, gateway });
  if (info) {
    await PaymentInfo.findOneAndUpdate({ userid, gateway }, { paymentData });
  } else {
    await PaymentInfo.create({ userid, gateway, paymentData });
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////

// This function is for send mail about payment
exports.sendPaymentEmail = async (
  userData,
  gateway,
  status,
  type,
  amount,
  currency,
  message,
  flag = false
) => {
  if (!userData.notify_email) return;

  const mailData = await EmailTemplateList.findOne({ name: "payment" });
  const logo = await SiteConfigs.findOne({ key: "logo" });
  const footerData = await EmailTemplateList.findOne({ name: "footer" });
  const lang = userData.language || "en";
  const letter = mailData.param[lang] || mailData.param["en"];
  const footer = footerData.param[lang] || footerData.param["en"];

  let image = `${servConf.AdminUrl}${gateway.image}`;
  let name = letter[gateway.name];

  if (
    gateway._id == ProConf.CoinsPaid.id ||
    gateway._id == ProConf.CoinsPaid.wid
  ) {
    image = `${servConf.AdminUrl}/image/site/payment/${currency}.png`;
    name = letter[`${currency}-${type}`];
  }

  const status2 =
    status == "Failure" ? letter.type1 : flag ? letter.type2 : letter.type3;
  let content = letter[`${type}-content`];
  content = content.split("amount").join(amount);
  content = content.split("currency").join(currency);
  content = content.split("type").join(type);
  content = content.split("name").join(name);
  content = content.split("status2").join(status2);

  baseController.sendEmail(
    userData.email,
    {
      user: userData.username,
      image,
      status1: letter[status],
      type: letter[type],
      url: servConf.SiteUrl,
      site: servConf.site,
      domain: `${servConf.site}.com`,
      message:
        status == "Failure" && !message
          ? letter.letter8
          : message
            ? letter[message]
            : "",
      logo: `${servConf.AdminUrl}${logo.value}`,
      title: letter[`${type}-title`],
      content,
      data: letter,
      footer,
    },
    mailData.tid
  );
};

// Send Payment Notification
exports.sendPaymentNotification = async (
  userData,
  gateway,
  status,
  type,
  amount,
  currency
) => {
  const key =
    type == "Deposit"
      ? status == "Success"
        ? "depositsuccess"
        : "depositfailure"
      : status == "Success"
        ? "withdrawalsuccess"
        : status == "Pending"
          ? "withdrawalpending"
          : "withdrawalfailure";

  const nData = await NotifyTemplateList.findOne({ name: key });
  if (nData && userData.notify_site) {
    const lang = userData.language || "en";
    let letter = nData.param[lang]
      ? nData.param[lang].letter
      : nData.param["en"].letter;
    letter = letter.split("<username>").join(`<b>${userData.username}</b>`);
    letter = letter.split("<amount>").join(`<b>${amount} ${currency}</b>`);
    letter = letter.split("<name>").join(`<b>${gateway.name}</b>`);

    const receiver = [
      {
        _id: String(userData._id),
        verify_email: userData.verify_email,
        verify_sms: userData.verify_sms,
        language: userData.language,
        email: userData.email,
        phone: userData.phone,
        name: userData.username,
        saw: false,
      },
    ];

    NotificationList.create({
      method: "site",
      receiver,
      sender: userData.created,
      auto: true,
      content: JSON.stringify({
        title_site: nData.param[userData.language].title,
        content_site: `<span>${letter}</span>`,
      }),
    });
  }

  // This is for send notification when withdraw request added
  const adminUser = await MainUser.findOne({
    id: mainConfig.USERS.superagent_user,
  });
  const nData1 = await NotifyTemplateList.findOne({ name: "wrcount" });

  if (key == "withdrawalpending" && adminUser.notify_site && nData1) {
    const wrCount = await BalanceHistory.countDocuments({
      paymentType: mainConfig.PAYMENT.WITHDRAWL,
      status: "waiting_confirm",
    });
    const lang = adminUser.language || "en";
    let letter = nData1.param[lang]
      ? nData1.param[lang].message
      : nData1.param["en"].message;
    letter = letter.split("<username>").join(`<b>${adminUser.username}</b>`);
    letter = letter.split("<count>").join(`<b>${wrCount}</b>`);

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
};

// These functions are for Bank payout
exports.checkUserProfile = async (user, id, amount, currency) => {
  const gateway = await PaymentList.findOne({ _id: id });

  if (
    !user.firstname ||
    !user.lastname ||
    !user.username ||
    !user.email ||
    !user.phone ||
    !user.country ||
    !user.city ||
    !user.birthday ||
    !user.state ||
    !user.postcode
  ) {
    this.sendPaymentEmail(
      user,
      gateway,
      "Failure",
      "Withdrawal",
      amount,
      currency,
      "Because you didn't finish your profile setting so please update your profile information"
    );
    this.sendPaymentNotification(
      user,
      gateway,
      "Failure",
      "Withdrawal",
      amount,
      currency
    );
    return "Please finish your profile setting";
  }
  if (user.kyc_status != "allow") {
    this.sendPaymentEmail(
      user,
      gateway,
      "Failure",
      "Withdrawal",
      amount,
      currency,
      "Because you didn't verify your first step verification so please finish your first step verification"
    );
    this.sendPaymentNotification(
      user,
      gateway,
      "Failure",
      "Withdrawal",
      amount,
      currency
    );
    return "Please finish first step verification";
  }
  return true;
};

exports.bankWithdraw = async (req, res) => {
  try {
    const flag = await this.checkUserProfile(
      req.user,
      ProConf.Bank.id,
      req.body.amount,
      req.user.currency
    );
    if (flag !== true) {
      return res.status(500).send(flag);
    }
    const user = req.user;
    const currency = user.currency;

    const uuid = uuidv4.v4();
    const {
      amount,
      description,
      bankName,
      branchAddress,
      bicSwift,
      iban,
      beneficiaryName,
    } = req.body;

    if (Number(amount) > user.balance[currency]) {
      return res
        .status(400)
        .send("you don't have enough credit on your balance");
    }

    await this.saveCardInfo(user.id, ProConf.Bank.id, {
      bankName,
      branchAddress,
      bicSwift,
      iban,
      beneficiaryName,
    });

    await MainUser.findOneAndUpdate(
      { id: user.id },
      {
        $inc: {
          [`balance.${user.currency}`]: -amount,
          [`lock_balance.${user.currency}`]: Number(amount),
        },
      }
    );

    const d_wallet = {
      userid: user.id,
      amount,
      amountType: mainConfig.AMOUNTTYPE.CASH,
      paymentType: mainConfig.PAYMENT.WITHDRAWL,
      paymentMethod: ProConf.Bank.id,
      transactionId: uuid,
      lastbalance: await baseController.getAmount(
        user.currency,
        user.balance[user.currency]
      ),
      comment: description,
      currency: user.currency,
      permission: user.permission,
      relateUser: user.created,
      status: "waiting_confirm",
      detail: { bankName, branchAddress, bicSwift, iban, beneficiaryName },
    };
    await BalanceHistory.create(d_wallet);

    const gateway = await PaymentList.findOne({ _id: ProConf.Bank.id });
    this.sendPaymentNotification(
      user,
      gateway,
      "Pending",
      "Withdrawal",
      amount,
      user.currency
    );

    return res.status(200).send("Please wait confirm");
  } catch (error) {
    console.error({ title: "bankWithdraw", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

// These functions are for Get Transaction urls from Praxis
exports.checkBeforeWithdrawal = async (user) => {
  if (
    !user.firstname ||
    !user.lastname ||
    !user.username ||
    !user.email ||
    !user.phone ||
    !user.country ||
    !user.birthday ||
    !user.state ||
    !user.street ||
    !user.city ||
    !user.postcode
  ) {
    return "Please finish your profile setting";
  }
  if (user.kyc_status != "allow") {
    return "Please finish first step verification";
  }
  return true;
};

exports.getPraxisUrl = async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const uuid = uuidv4.v4();

    const user = req.user;
    const payPermission = await PaymentPermissionList.findOne({
      userid: user.created,
    });

    const key = req.body.type == 1 ? ProConf.Praxis.wid : ProConf.Praxis.id;
    if (!payPermission.gatewayData[key]) {
      return res.status(400).send("You don't have permission");
    }

    if (req.body.type == 1) {
      const flag = await this.checkBeforeWithdrawal(user);
      if (flag !== true) {
        return res.status(500).send(flag);
      }
    }

    const sendData = {
      merchant_id: ProConf.Praxis.MerchantId,
      application_key: ProConf.Praxis.ApplicationKey,
      timestamp: timestamp,
      intent: req.body.type == 1 ? "withdrawal" : "payment",
      cid: user.id,
      order_id: uuid,
      currency: user.currency,
      version: "1.3",
      locale: "en-GB",
      notification_url: `${servConf.AdminUrl}/admin/payment/praxis`,
      return_url: servConf.SiteUrl,
      customer_data: {
        email: user.email,
        first_name: user.firstname,
        last_name: user.lastname,
        country: user.country,
        city: user.city,
        street: user.street || user.state,
        zip: user.postcode,
        phone: user.phone,
      },
    };

    const signature = await baseController.praxisSign(sendData);
    const rdata = await baseController.axiosRequest(
      ProConf.Praxis.Endpoint,
      sendData,
      "POST",
      {
        "GT-Authentication": signature,
      }
    );

    if (rdata) {
      return res.status(200).send({ url: rdata.redirect_url });
    } else {
      return res.status(400).send("Server Error");
    }
  } catch (error) {
    console.error({ title: "getPraxisUrl", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};
