const baseController = require("./baseController");

const { SportsBetHistory } = require("../models");

const tblConfig = require("../config/tablemanage");

// Get My Data in Register page
exports.getBetSlipData = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(200).json({ status: false });
    }

    const data = await SportsBetHistory.aggregate([
      {
        $match: {
          transactionId: id,
        },
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
          type: "$detail.TypeId",
          state: "$detail.State",
          live: "$detail.IsLive",
          bet: "$detail.BetAmount",
          win: "$detail.WinAmount",
          odd: "$detail.Coefficient",
          date: "$detail.BetDate",
          select: "$detail.selectData",
        },
      },
    ]);

    if (data && data.length) {
      const rdata = data[0];
      for (let i = 0; i < rdata.select.length; i++) {
        const url = `https://sportsbookwebsitewebapi.iqsoft.info/website/getmatchbyid?LanguageId=en&TimeZone=0&MatchId=${rdata.select[i].MatchId}`;
        const selectData = await baseController.axiosRequest(url, {}, "GET");
        if (selectData) {
          rdata.select[i].S = selectData.S;
          rdata.select[i].RsI = selectData.RsI;
          rdata.select[i].T = selectData.T;
          rdata.select[i].TD = selectData.TD;
        }
      }
      return res.status(200).json({ status: true, data: rdata });
    } else {
      return res.status(200).json({ status: false });
    }
  } catch (error) {
    console.error({
      title: "getBetSlipData",
      message: error.message,
      date: new Date(),
    });
    return res.status(200).json({ status: false });
  }
};
