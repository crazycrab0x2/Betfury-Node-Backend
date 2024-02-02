module.exports = {
    // DBCONNECT: "mongodb+srv://Killbot:uQYssfs8NmI0JezO@cluster1.qolr2ku.mongodb.net/8866casino",
    DBCONNECT: "mongodb://localhost:27017/betfury",
    ServerPort: 2000,
    BASEURL: __dirname + "/uploads/",
    DIR: __dirname,
    JTW_KEY: "$R5IGMDC8HwUBNZGUWfA5ZHDE9EfrJxyALeSjU3Qu2bfxVtp8UqKQjUvbAZzgBceX84sbsBGt2SpEU54Z5dMAh7aGEpDqNHECLTtM4SNmn59k$",
    session: {
        expiretime: 1000 * 60 * 60 * 30
    },
    site: "test108",
    sitename: "test108.com",
    SiteUrl: "https://test108.com",
    gameUrl: "https://game.test108.com",
    apiUrl: "https://api.test108.com",
    AdminUrl: "https://admin.test108.com",
    prefix: "1",
    mode: "test",
    capchaKey: {
        "https://test108.com": {
            SECRETKEY: "6Lf2cUIhAAAAAMXV_ayXWzCZiti3f2IOidxRTetV",
            SITEKEY: "6Lf2cUIhAAAAAHVBDaJvBkguUWQCx5Vfpt8sXd-c"
        }
    },
    wallet: {
        nowpayment_endpoint: "https://api.nowpayments.io/v1",
        // nowpayment_api_key: "6MW4VG8-88JM6R5-JSN27RA-4Y35EZG",
        nowpayment_api_key: "J0VAZJ2-ZXNMC9H-QDQ18WX-88D95XT",
        // nowpayment_api_key: "ASFF023-R7D4JB3-NPNYRZV-469KABE"
    },
    gameAPI: {
        casinoGoild: {
            // operatorID: "europa777",
            operatorID: "europa777_stg",
            // secretKey: "gcwUCqudIkqN5eKQ",
            secretKey: "eq5t49Wh7CisHvUX",
            // hostURL1: "https://launch.timelesstech.org",
            // hostURL2: "https://play.cusinovegaz.com",
            hostURL1: "https://staging-wallet-launch1.semper7.net",
            hostURL2: "https://staging-wallet-launch1.semper7.net",
            // gameURL: "https://air.gameprovider.org" 
            gameURL: "https://staging-wallet.semper7.net/api/generic/games/list/all"
        },
        BlueOcean: {
            api_login: "europa777_mc_s",
            api_password: "DfZWKz2o6Zp4UrcXhP",
            saltKey: "Kiauq7189a",
            hostURL: "https://stage.game-program.com/api/seamless/provider",
        },
        Ryan: {
            // Production mode
            api_login: "a2ed9e06-2c9a-43be-a2c9-a7b10d6b366a-722505", 
            api_password: "tlvQvHb8PYs9", 
            saltKey: "f6r8YekhVy", 
            hostURL: "https://gs.dicer.app/api/system/operator", 

            //Staging mode
            // api_login: "f4c14c4a-0c83-425d-8518-7c08ceeeed56-161921",    
            // api_password: "CVP6lgiR5wEv", 
            // saltKey: "Nxx1vX1AYmbUk",  
            // hostURL: "https://gs.dicer.app/api/system/operator" 
        }
    }
}

// 200 success
// 400 client request data error
// 401 user auth error
// 403 permission error
// 500 server error
// 429 too many request
