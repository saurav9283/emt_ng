const {
  footBallQuizHandler,
  smsHandler,
} = require("../../games/football/football.game");
const {
  deleteFormTblAnsLogs,
} = require("../../games/football/football.services");
const {
  instantGameSmsHandler,
  instantGameHandler,
} = require("../../games/instantGame/instant.game");
const {
  insertIntoInstantLogs,
  insertIntoInstantSession,
  updateInstantLosg,
  deleteFromInstantLogs,
} = require("../../games/instantGame/instant.services");
const {
  npflFootballHandler,
} = require("../../games/npflFootballQuiz/npfl.football.controller");
const {
  _npfl_deleteFormTblAns,
  _npfl_deleteFormTblAnsLogs,
  _npfl_deletedUserPoints,
} = require("../../games/npflFootballQuiz/npfl.football.services");
const { sendSms } = require("../../lib/sendSms");
const {
  insertUserPoints,
  deletedUserPoints,
} = require("../../services/sms.services");
const {
  insertCallbackLogs,
  insertIntoUnsub,
  deleteFromSubscription,
  getServiceInfo,
  insertIntoTblSubscription,
  updateTableSubscription,
  insertIntoBillingSuccess,
  insertIntoUserLogsOnAllQuestionAsked,
  deleteFormSmsPending,
  checkExistingSub,
  checkBillingSuccessExist
} = require("./callback.services");

module.exports = {
  callbackNotification: async (req, res) => {
    console.log(req.body);
    const {
      pisisid,
      pisipid,
      updatetype,
      autorenew,
      channel,
      msisdn,
      startdate,
      enddate,
      trxid,
      amount,
      senderAddress,
      message,
      network,
      chargedate,
    } = req.body;

    insertCallbackLogs(req.body, async (err, data) => {
      if (err) throw err;
      console.log("LOGS_SAVED_SUCCSSFULLY->");
      // SUBSCRIPTION HANDLER
      let service, packType;
      // saving billing logs
      var type_event =
        updatetype == "modification"
          ? "REN"
          : updatetype == "charged"
          ? "MORE"
          : updatetype == "deletion"
          ? "UNSUB"
          : "SUB";

      if (
        updatetype == "modification" ||
        updatetype == "charged" ||
        updatetype == "deletion" ||
        updatetype == "addition"
      ) {
        //  inserting into billing success
        const [e3, params] = await getServiceInfo(pisisid, pisipid);

        if (e3 || !params)
          return res.status(500).json({
            result: 0,
            msg: "INTERNAL SERVER ERROR",
          });

        service = params.product;
        // packtype
        packType = params.product.includes("Daily")
          ? "DAILY"
          : params.product.includes("Weekly")
          ? "WEEKLY"
          : params.product.split(" ").pop();
      }

      if (updatetype == "deletion") {
        // UNSUB HANDLER
        // check if subscription exist ->
        // const [ex1, user_exist] = await checkSubscription(msisdn);
        console.log("service in unsub ->", [service, msisdn]);
        const [e0, smsPending] = await deleteFormSmsPending(msisdn, service);
        console.log([e0, smsPending]);

        const [e1, unsubed] = await insertIntoUnsub(msisdn, service, channel);

        console.log("INSERTED UNSUBSCRIPTION", { e1, unsubed });

        if (e1)
          return res.status(500).json({
            result: 0,
            msg: "FAILED TO UNSUBSCRIBE USER",
            type: "e1",
          });

        const [e2, deleted] = await deleteFromSubscription(msisdn, pisisid);

        console.log("DELETED SUBSCRIPTION", { e2, deleted });

        if (e2)
          return res.status(500).json({
            result: 0,
            msg: "FAILED TO UNSUBSCRIBE USER",
            type: "e2",
          });

        if (pisisid == 174) {
          // football quiz
          console.log("UNSUBBING FOOT BALL SERVICE ->");
          const [e3, success] = await deletedUserPoints(msisdn);

          console.log("DELETED USER POINTS", { e3, success });

          if (e3)
            return res.status(500).json({
              result: 0,
              msg: "FAILED TO UNSUBSCRIBE USER",
              type: "e2",
            });

          const [ey, deleted] = await deleteFormTblAnsLogs(msisdn);
          console.log([ey, deleted]);

          return res.status(200).json({ result: 1, msg: deleted });
        } else if (pisisid == 199) {
          // game box unsub
          console.log("unsub npfl football quiz box =>", msisdn);
          const [ee, deletedUserPoints] = await _npfl_deletedUserPoints(msisdn);
          console.log(ee, deletedUserPoints);
          const [ex, ok1] = await _npfl_deleteFormTblAnsLogs(msisdn);
          console.log(ex, ok1);
          return res.send("queued");
        } else if (service.includes("Instant")) {
          // instant game
          // deleted session for instant game when user unsub
          const [d1, ok1] = await updateInstantLosg(msisdn, "UNSUB");
          console.log(ok1);
          var [d2, ok2] = await insertIntoInstantLogs(msisdn);
          console.log(ok2);
          const [d3, ok3] = await deleteFromInstantLogs(msisdn);
          console.log(ok3);

          return res.status(200).json({ result: 1, msg: "OK" });
        } else if (service.includes("Goal")) {
          // goal alert
          return res.status(200).json({ result: 1, msg: "OK" });
        }
        return res.status(200).json({ result: 1, msg: "OK" });
      }

      // save billing success
      if (updatetype == "modification" || updatetype == "charged") {
        // inserting into billing success
        const [ex, exist] = await checkBillingSuccessExist(msisdn, service, startdate);
        if (exist <= 0) {
          
          insertIntoBillingSuccess({
            msisdn,
            type_event,
            mAct: channel,
            autorenew,
            service,
            packType: packType,
            trxid,
            amount,
            startdate: startdate ?? chargedate,
            enddate,
            callback_response: JSON.stringify(req.body),
            network,
          });
        } else {
          console.log("billing_success_exist =>", msisdn, exist);
        }
      }

      if (updatetype == "addition") {
        // SAVING BILLING LOGS ->
        // USER DONT EXIST SO INSERT NEW SUBSCRIPTION
        const [e, exist] = await checkExistingSub(msisdn, pisisid);
        if (e) return res.json({ e, result: 0 });
        if (exist >= 1)
          return res.json({ result: 1, msg: "Already a subscriber" });

        const [i1, subInserted] = await insertIntoTblSubscription({
          msisdn,
          type_event,
          mAct: channel,
          autorenew: autorenew,
          service,
          packType: packType,
          trxid,
          startdate,
          enddate,
          amount,
          network,
          active: "TRUE",
          pisisid,
        });

        console.log("SUB_INSERTED", { i1, subInserted });

        if (i1)
          return res.status(500).json({
            result: 0,
            msg: "FAILED TO SAVE SUBSCRIPTION LOGS",
          });

        // 10 is user points
        if (pisisid == 174) {
          console.log("SENDING FOOTBALL QUIZ SMS TO USER");
          // football sms handler
          return footBallQuizHandler(req.body, res);
        } else if (pisisid == 199) {
          // npfl football quiz
          return npflFootballHandler(req.body, res);
        } else if (pisisid == 198) {
          // game box
          sendSms({
            pisisid: String(pisisid),
            msisdn,
            message: process.env.gameBoxSubSms,
            trxid: trxid,
          });
          return res.send("queued");
        } else if (pisisid == 188) {
          // video central service
          console.log(
            "------------- VIDEO CENTRAL SERVICE SUB------------ =>",
            [msisdn]
          );
          const smsPayload = {
            pisisid: process.env.VIDEO_CENTRAL_PISISID,
            msisdn,
            message: process.env.VIDEO_CENTRAL_SMS_SUB,
            trxid,
          };
          console.log(smsPayload);
          const data = await sendSms(smsPayload);
          console.log(data);

          return res.json({
            result: 1,
            msg: "ok",
          });
        } else if (
          pisisid == 176 ||
          pisisid == 177
        ) {
          console.log("SENDING INSTANT SMS TO USER");
          // instant game sms here
          instantGameSmsHandler(msisdn, trxid, pisisid, pisipid, "SUB");
          insertIntoInstantSession(
            msisdn,
            trxid,
            pisisid,
            pisipid,
            type_event,
            "PENDING"
          );
        }

        res.status(200).json({ result: 1, msg: subInserted });

        return;
      } else if (updatetype == "modification") {
        // RENEWAL
        const [u1, subUpdated] = await updateTableSubscription({
          startdate,
          enddate,
          type_event,
          trxid,
	  amount,
          msisdn,
          pisisid
        });

        console.log("SUB_UPDATED", { u1, subUpdated });

        if (u1)
          return res.status(500).json({
            result: 0,
            msg: "INTERNAL SERVER ERROR",
            type: "UPDATE",
          });

        if (pisisid == 188) {
          console.log("Video central renawal =>", [msisdn]);
          const smsPayload = {
            pisisid: process.env.VIDEO_CENTRAL_PISISID,
            msisdn,
            message: process.env.VIDEO_CENTRAL_SMS_REN,
            trxid,
          };
          const data = await sendSms(smsPayload);
          console.log(data);
        }

        return res.status(200).json({ result: 1, msg: subUpdated });
      } else if (updatetype == "charged" && service.includes("Instant")) {
        // draw for more
        instantGameHandler(req.body, res);
        // create session
        console.log("CREATING USER SESSION");

        return res.status(200).send("OK");
      } else if (updatetype == "charged" && pisisid == 175) {
        console.log("__---------------- INSIDE FOOTBALL -------------__");
        // console.log(service)
        return footBallQuizHandler(req.body, res);
      } else if (updatetype == "charged" && pisisid == 200) {
        // on deman npfl football
        // console.log(service)
        console.log("Inside npfl =>");
        return npflFootballHandler(req.body, res);
      } else if (!updatetype && message) {
        console.log(message);
        if (message == "PLAY" || message == "WIN") {
          // instant game
          console.log("FORWARDING INSTANT GAME HANDLER");
          instantGameHandler(req.body, res);
          return res.status(200).send("OK");
        } else if (message == "C" || message == "D") {
          return npflFootballHandler(req.body, res);
        } else if (message == "A" || message == "B") {
          // footballquiz
          console.log("FORWARDING GAME GAME HANDLER");
          footBallQuizHandler(req.body, res);

          return res.status(200);
        } else {
          res.send("OUTSIDE");
        }
      }
    });
  },
};
