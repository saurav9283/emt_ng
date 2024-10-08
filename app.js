var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
var cors = require("cors");
var campaignsRouter = require("./routes/index");
var callbackRouter = require("./routes/callbacks/callbacks.router");
var loginRouter = require("./routes/login/login.router");
var fileUploadRouter = require("./routes/UploadFile/UploadFile.router");
var cron = require("node-cron");
var cp = require("child_process")

var app = express();
var cors = require("cors");
const { getToken } = require("./lib/authToken");
const { liveScoreSend } = require("./threads/liveMatchAlert");
const { getLiveMatchesForToday } = require("./goal alerts/liveFixtures");
const {
  getDailyMatches,
  getCurrentMatches,
} = require("./goal alerts/dailyFixtures");
const {
  upcomingMatchesThread,
  dailyMatchAlerts,
} = require("./threads/dailyUpcomingMatches");
const liveMatchAlert = require("./threads/liveMatchAlert");
const { sendLiveQuestions } = require("./threads/sendDailyQuestions");
const { checkSub } = require("./routes/check-sub/checkSub.index");
const { getWeeklyFixtures } = require("./goal alerts/weeklyFixtures");
const { InstantReport } = require("./threads/instantThread");
const { _npflsendLiveQuestions } = require("./threads/sendDailyQuestionsNpfl");

const event = require("events");
const { makeReport } = require("./calculate");

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3009",
      "http://icmtn.toon-flix.com",
      "http://www.icmtn.toon-flix.com",
      "http://localhost:3010",
      "http://videocentral.org",
    ],
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

var league = process.env.LEAGUE, // current leauge
  season = new Date().getFullYear(), // currrent year
  current_date = new Date().toISOString().split("T")[0];

// // Get scores from rapid api and update in database
// setInterval(async () => {
//   getLiveMatchesForToday(league, season);
// }, 30 * 1000);

// const eventEmmiter = new event.EventEmitter();

// eventEmmiter.on("liveScore", liveScoreSend);

// eventEmmiter.emit("liveScore");

// //sendLiveQuestions(); // for sending daily live questions
// _npflsendLiveQuestions();// npfl daily questions
// dailyMatchAlerts(); // alert for daily matches ->

//InstantReport();


// ------------------------------------------------------------------------------------
// get daily and upcoming matches
// setInterval(
//   async () => {
//     getDailyMatches(league, season, current_date);
//   },
//   3 * 60 * 60 * 1000 // every 6 hourss
// );

// // -------------------------------------------------------------------------------------
// // getting today matches ->
// setInterval(async () => {
//   getCurrentMatches(league, season, current_date);
// }, 1 * 60 * 1000);
// // -------------------------------------------------------------------------------------

app.use("/", campaignsRouter);
app.use("/check-sub", checkSub);
app.use("/callback", callbackRouter);
app.use("/api", loginRouter);
app.use("/api/upload", fileUploadRouter);
app.get("/api/weekly-fixtures", getWeeklyFixtures);

app.use(express.static(path.join(__dirname, "footballadmin")));

app.get("/api/reboot", (req, res) => {
  process.exit(1);
  res.send("reboot successfully")
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "footballadmin", "index.html"));
});

const services = [
  "Football",
  "Instant",
  "Goal",
  "Video",
  "NPFL",
  "Game Box"
];
// important here =>
// setInterval(() => {
//   services.forEach(
//     item => setTimeout(
//       () => makeReport(item), 1000
//     )
//   )
// }, 30 * 1000);

// const job1 = cron.schedule('0 0 1 * * *', () => {
//     console.log("running every 1 hour=>")
//     cp.exec( 
//         'sh pickNumbersForQuiz.sh >> ./pickNumbersForQuiz.log',
//         (err, stdout, stderr) => {
//             console.log(err, stdout, stderr);
//         }
//     );
// });

// job1.start();

// const job2 = cron.schedule('0 0 5 * * *', () => {
//   console.log("restarting...")
//   process.exit(1);
// });

// job2.start();


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

process.on("uncaughtException", function () {
  process.exit(1);
});

module.exports = app;
