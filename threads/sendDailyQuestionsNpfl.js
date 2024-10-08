const { promise_pool } = require("../database");
const {
  _npfl_getRandomWelcomeQuestion,
  _npfl_insertIntoUserAnswerLogs,
  _npfl_insertIntoTableAnswer,
} = require("../games/npflFootballQuiz/npfl.football.services");
const { insertIntoSmsSent } = require("../goal alerts/goal.alert.services");
const { sendSms } = require("../lib/sendSms");
const {
  deleteFormSmsPending,
} = require("../routes/callbacks/callback.services");

module.exports = {
  _npflsendLiveQuestions: async () => {
    for (let i = 0; i <= Infinity; i++) {
      await _npflsendQuestions();
      await sleep(2);
    }
  },
};

async function _npflsendQuestions() {
  console.log(
    "--------------------------- SENDING NPFL FOOTBALL QUESTIONS -------------------------------"
  );
  try {
    const [error1, pendingSubscribers] = await _npflgetAllMsisdn();

    if (error1) {
      console.error(`Error fetching subscribers: ${error1}`);
      return;
    }

    console.log("Pending NPFL footbal sms ->", pendingSubscribers.length);

    if (pendingSubscribers.length > 0) {
      // Notify all pending subscribers
      const notificationPromises = pendingSubscribers.map(
        async ({ msisdn, trxid, service, type_event }) => {
          const [paramsError, smsParams] = await _npfl_getRandomWelcomeQuestion(
            msisdn
          );

          if (paramsError)
            return console.log("ERROR IN NPFL SMS PARAMS", paramsError);

          const sms = smsParams.message;

          var smsPayload = {
            pisisid: process.env._NPFL_FOOTBALL_PISISID,
            msisdn,
            message: sms,
            trxid,
          };

          console.log({ smsPayload });
          // sending user sms
          const [smsError, success] = await sendSms(smsPayload);
          console.log(success);
          if (smsError) {
            console.log("sms error");
            console.log(smsError);
            return { msisdn, smsError };
          }
          console.log("ADDING QUESTION NPFL->");
          // for logs
          await _npfl_insertIntoUserAnswerLogs(
            msisdn,
            smsParams.id, // question id
            smsParams.correct_option, // correct option
            type_event,
            trxid
          );
          // for compare
          await _npfl_insertIntoTableAnswer(
            msisdn,
            smsParams.id, // question id
            smsParams.correct_option // correct option
          );

          const [e0, saved] = await insertIntoSmsSent(
            msisdn,
            trxid,
            type_event,
            null,
            "NPFL_FOOTBALL_QUIZ",
            smsParams.message,
            JSON.stringify(smsPayload),
            JSON.stringify(success),
            "NPFL_FOOTBALL"
          );

          if (e0) throw new Error(`error in inserting NPFL sms sent logs:`, e0);

          const [e1, ok] = await deleteFormSmsPending(msisdn, service);

          if (e1) throw new Error(`error in deleting NPFL penging sms:`, e1);

          console.log({ ok, saved });
          return { msisdn, success, ok };
        }
      );

      const results = await Promise.all(notificationPromises);

      return results;
    } else {
      console.log("No subscriptions to send NPFL Football questions --->");
      console.log("sleeping for 4 hours =>")
      await sleep(4 * 60 * 60);
      return false;
    }
  } catch (e) {
    console.error(`Error in sending quiz NPFL questions ->>>>`, e);
    return e;
  }
}

async function _npflgetAllMsisdn() {
  try {
    const [rows] = await promise_pool.query(
      process.env.PICK_MSISDN_FOR_FOOTBALL_NPFL
    );
    return [null, rows];
  } catch (error) {
    console.error(`Error fetching msisdn: ${error}`);
    return ["Error getting msisdn NPFL"];
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
