const requestIp = require("request-ip");

const whitelist = ["https://8866casino.net"];
const iplist = [];

exports.corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  try {
    const ip = requestIp.getClientIp(req);
    const ipaddress = ip.replace("::ffff:", "");

    if (iplist.indexOf(ipaddress) !== -1) {
      corsOptions = true;
    } else if (req.method === "GET") {
      corsOptions = false;
    } else if (
      req.header("Origin") !== undefined &&
      whitelist.indexOf(req.header("Origin")) !== -1
    ) {
      corsOptions = false;
    } else {
      corsOptions = true;
    }
  } catch (error) {
    corsOptions = true;
  }
  callback(corsOptions);
};
