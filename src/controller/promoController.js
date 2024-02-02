const requestIp = require("request-ip");

const { LandingPageList } = require("../models");

const baseController = require("./baseController");

// Get My Data in Register page
exports.getLandingImage = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(200).json({ status: false });
    }

    const landing = await LandingPageList.findOne({ lid: id, status: true });
    if (!landing) {
      return res.status(200).json({ status: false });
    }

    let ip = requestIp.getClientIp(req);

    if (ip == "::1") ip = "8.8.8.8";
    const data = await baseController.getUserData(ip);
    const language =
      data && data.countryCode
        ? String(data.countryCode).toLocaleLowerCase()
        : "en";
    const device = req.headers.device > 1200 ? "desktop" : "mobile";
    const image =
      landing.image[device] && landing.image[device][language]
        ? landing.image[device][language]
        : landing.image[device]["en"];

    return res
      .status(200)
      .json({ status: true, image, url: landing.url, title: landing.title });
  } catch (error) {
    console.error({
      title: "getLandingImage",
      message: error.message,
      date: new Date(),
    });
    return res.status(200).json({ status: false });
  }
};
