const { promise_pool } = require("../database");
const {
  insertIntoInstantLogs,
  deleteFromInstantLogs,
} = require("../games/instantGame/instant.services");
const { sendSms } = require("../lib/sendSms");

module.exports = {
  InstantReport: async () => {
    while (true) {
      await insertInstantSessionNumber();
      await instanThreadHandler();
      await sleep(5);
    }
  },
};

async function instanThreadHandler() {
  const [e1, pendingMsisdn] = await pickInstantReportNumbers();
  if (e1 || pendingMsisdn.length === 0) {
    console.log(e1, "Instant Pending Msisdn length =>", pendingMsisdn.length);
    console.log("sleeping instant thread for 2 hours =>");
    await sleep(2 * 60 * 60);
    return false;
  }

  var sms =
    'NGN <NO1> NGN <NO2> NGN <NO3> You need match three amounts to win. Please try again! you can PLAY more by sending "MORE" to 20781.';
  const pendingNotification = pendingMsisdn.map(async (item) => {
    // getting random numbers
    const randomNumbers = [];
    for (let i = 0; i < 3; i++) {
      randomNumbers.push(Math.floor(1000 + Math.random() * 3001));
    }

    var smsPayload = {
      pisisid: item.pisisid.toString(),
      msisdn: item.msisdn,
      message: sms
        .replace("<NO1>", randomNumbers[0])
        .replace("<NO2>", randomNumbers[1])
        .replace("<NO3>", randomNumbers[2]),
      trxid: item.trxid,
    };

    console.log({ smsPayload });
    // sending user sms
    const [smsError, success] = await sendSms(smsPayload);
    if (smsError) {
      return [smsError, null];
    }
    // console.log(success)
    var [e2, ok2] = await insertIntoInstantLogs(item.msisdn);
    console.log(e2, "e2");
    if (e2) return [e2, null];
    const [e3, ok3] = await deleteFromInstantLogs(item.msisdn);
    if (e3) return [e3, null];
    return [null, { ok2, ok3, message: success.message }];
  });
  const results = await Promise.all(pendingNotification);
  console.log(results);
  return true;
}

async function pickInstantReportNumbers() {
  try {
    const [rows] = await promise_pool.query(
      process.env.pickPendingInstantReportMsisdn
    );
    return [null, rows];
  } catch (e) {
    console.log(e);
    return [e];
  }
}

async function insertInstantSessionNumber() {
  try {
    const [row] = await promise_pool.query(
      process.env.insertInstantNotificationNumbers
    );
    console.log("Instant inserted data =>", row.affectedRows);
    return [null, "Inserted new Numbers for instant report"];
  } catch (e) {
    console.log(e, "ERROR in instant thread");
    return [e];
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
