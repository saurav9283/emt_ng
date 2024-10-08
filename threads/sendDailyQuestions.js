const { promise_pool } = require("../database");

const {
  insertIntoUserAnswerLogs,
  insertIntoTableAnswer,
} = require("../games/football/football.services");
const { insertIntoSmsSent } = require("../goal alerts/goal.alert.services");
const { sendSms } = require("../lib/sendSms");
const {
  getRandomWelcomeQuestion,
  deleteFormSmsPending,
} = require("../routes/callbacks/callback.services");

module.exports = {
  sendLiveQuestions: async () => {
    for (; ;) {
      await sendQuestions();
      await sleep(4);
    }
  },
};

async function sendQuestions() {
  console.log("processing football =>");
  try {
    const [error1, pendingSubscribers] = await getAllMsisdn();

    if (error1) {
      console.error(error1);
      return `Error fetching subscribers:`;
    }
    console.log("Pending footbal sms =>", pendingSubscribers.length);
    if (pendingSubscribers.length > 0) {
      // Notify all pending subscribers
      for (let i = 0; i < pendingSubscribers.length; i++) {
        const { msisdn, trxid, service, type_event } = pendingSubscribers[i];
        const [paramsError, smsParams] = await getRandomWelcomeQuestion(
          msisdn
        );
        // if error in params =>
        if (paramsError) {
          console.log(paramsError);
          return paramsError
        }
        const sms = smsParams.message;
        var smsPayload = {
          pisisid: process.env.FOOTBALL_PISISID,
          msisdn,
          message: sms,
          trxid,
        };
        // sending user sms
        const [smsError, success] = await sendSms(smsPayload);

        if (smsError) {
          console.log(smsError);
          return `sms error for this number => ${msisdn}`;
        }
        // for logs
        await insertIntoUserAnswerLogs(
          msisdn,
          smsParams.id, // question id
          smsParams.correct_option, // correct option
          type_event,
          trxid
        );
        // for compare
        await insertIntoTableAnswer(
          msisdn,
          smsParams.id, // question id
          smsParams.correct_option // correct option
        );

        const [e0, saved] = await insertIntoSmsSent(
          msisdn,
          trxid,
          type_event,
          null,
          "FOOTBALL_QUIZ",
          smsParams.message,
          JSON.stringify(smsPayload),
          JSON.stringify(success),
          "FOOTBALL"
        );

        if (e0) throw new Error(`error in inserting sms sent logs:`, e0);

        const [e1, ok] = await deleteFormSmsPending(msisdn, service);

        if (e1) throw new Error(`error in deleting penging sms:`, e1);

        return `sms sended successfully => ${msisdn}`;
      }
    } else {
      await sleep(2 * 60 * 60);
      return 'sleeping for 3 hours no subscriptions =>';
    }
  } catch (e) {
    console.error(`Error in sending quiz questions ->>>>`, e);
    return e;
  }
}

async function getAllMsisdn() {
  try {
    const [rows] = await promise_pool.query(
      process.env.PICK_MSISDN_FOR_FOOTBALL
    );
    return [null, rows];
  } catch (error) {
    console.error(`Error fetching msisdn: ${error}`);
    return ["Error getting msisdn"];
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
