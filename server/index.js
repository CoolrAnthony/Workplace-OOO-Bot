require("dotenv").config();
const schedule = require('node-schedule');
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const PORT = process.env.PORT || 3000;
const webhook = require("./routes/webhook");
const ooo = require("./routes/ooo");
const db = require('./db_models/index')

//////////////////////////////////////Express//////////////////////////////////////
app.use(express.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "/public")));


//////////////////////////////////////Routes//////////////////////////////////////
app.use('/enableOOO', ooo.enable)
app.use('/updateOOO', ooo.update)
app.use("/webhook", webhook);

//////////////////////////////////////Crons//////////////////////////////////////
var Every10Mins = schedule.scheduleJob('*/10 * * * *', function () {
    var herokuKeepalive = require('../server/cron/herokuKeepalive')
    herokuKeepalive;
});


//////////////////////////////////////SQL//////////////////////////////////////
db.sequelize.sync().then(function () {
    app.listen(PORT);
    console.log("Express started on port " + PORT);
});