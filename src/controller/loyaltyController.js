const FundistService = require("../services/fundistService");
const { MainUser } = require("../models/users");
const { VipList } = require("../models/vip");
const service = FundistService.getInstance();

exports.getBonusById = async (req, res) => {
  try {
    const { userId, bonusId } = req.body;
    const data = await service.getBonusById(userId, bonusId);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json(e.message);
  }
};

exports.fetchUserLoyalty = async (req, res) => {
  const { user } = req;

  try {
    const {
      0: { TotalPoints, Level },
    } = await service.getUserLoyalty(user);
    const level = await VipList.findOne({ level: Level });
    const { vipPoint, vipLevel } = await MainUser.findOneAndUpdate(
      { _id: user.id },
      { vipPoint: TotalPoints, vipLevel: level._id },
      { new: true }
    );

    return res.status(200).json({
      vipPoint,
      vipLevel,
    });
  } catch (e) {
    console.error("Error fetching user loyalty", e);
    return null;
  }
};
