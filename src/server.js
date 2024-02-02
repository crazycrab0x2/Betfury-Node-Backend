require('dotenv/config')
const express = require('express')
const path = require("path")
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const config = require("../serverConf")
const SocketServer = require("./socket")
const apiRouter = require("./router")
const http = require("http")
const socketIo = require("socket.io")
const compression = require('compression')
const morgan = require('morgan')
const { createStream } = require('rotating-file-stream')
const useragent = require('express-useragent')
const methodOverride = require('method-override')
const { corsOptionsDelegate } = require('./middleware/auth')
const rateLimit = require('express-rate-limit')
const startFundistSync = require('./services/fundistSyncService');
const jwt = require('jsonwebtoken');
const baseController = require("./controller/baseController")
const { getGameListsCG } = require('./controller/gameControllerNew');
const { getGameListsBO } = require('./controller/gameControllerNew');
const { getGameListsRyan } = require('./controller/gameControllerNew');
const { getCODlist } = require('./controller/limitController');

const cashbackController = require('./controller/cashbackController');

const fs = require('fs');
const cron = require('node-cron')
const { coolOfPeriodList } = require('./models')
const app = express()
app.use(cors("*"))
const server = http.createServer(app);
mongoose.set('strictQuery', false);

mongoose.connect(config.DBCONNECT, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(async () => {
	console.log('Database is connected');
}, err => {
	console.log('Can not connect to the database ' + err)
})


const accessLogStream = createStream('access.log', { interval: '1d', path: path.join(config.DIR, 'log') })

const second = 4;
cron.schedule(`0 2 * * *`, () => {
	console.log("Cashback auto handler")
	cashbackController.handleCashback();
});

app.use(morgan('combined', { stream: accessLogStream }))
app.use(compression())
app.use(useragent.express())
app.use(express.static(config.DIR + '/uploads'))
app.use(express.static(config.DIR + '/client/build'))
app.use(bodyParser.json({ limit: "15360mb", type: 'application/json' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))
app.use(bodyParser.text({ type: 'text/html' }))
app.use(methodOverride())

// app.set("socketio", io)

app.set('trust proxy', 'loopback');

const apiV3Limiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 10000,
	standardHeaders: true,
	legacyHeaders: false,
})



app.use('/api', apiV3Limiter, (req, res, next) => { apiRouter(req, res, next) })
app.use('*', (req, res) => {
	res.sendFile(path.join(config.DIR, 'client/build/index.html'))
});

server.listen(config.ServerPort,
	() => {
		console.log(`Started server on => http://127.0.0.1:${config.ServerPort}`)
	}
);
const io = socketIo(server);
// io.on('connection', async (socket) => {
// 	console.log("connected", socket.id)
// });
// io.onconnection()
// SocketServer(io)