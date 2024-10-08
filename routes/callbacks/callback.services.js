const { pool, promise_pool } = require("../../database");

module.exports = {
  insertCallbackLogs: (data, callback) => {
    // console.log("DATA AMOUNT ", typeof data.amount);
    const sql = `
  INSERT INTO transactions_logs 
  (datetime,network, aggregator, trxid, msisdn, amount, pisisid, pisipid, startdate, enddate, updatetype, autorenew, channel, package)
  VALUES (now(),?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
    pool.query(
      sql,
      [
        data.network,
        data.aggregator,
        data.trxid === undefined ? data.id : data.trxid,
        data.msisdn === undefined ? data.senderAddress : data.msisdn,
        data.amount !== undefined
          ? data.amount.trim() === "" || data.amount.trim() === null
            ? 0.0
            : data.amount
          : 0.0,
        data.pisisid,
        data.pisipid,
        data.startdate !== undefined
          ? data.startdate.trim() === "" || data.startdate.trim() === null
            ? "2020-01-01 00:00:00"
            : data.startdate
          : "2020-01-01 00:00:00",
        data.enddate !== undefined ? data.enddate : "2020-01-01 00:00:00",
        data.updatetype === undefined ? "message" : data.updatetype,
        data.autorenew,
        data.channel,
        data.package,
      ],
      (err, results) => {
        if (err) {
          console.error("Error inserting data:", err);
          return callback(err);
        } else {
          console.log("Data inserted successfully.");
          return callback(null, "Success");
        }
      }
    );
  },
  getServiceInfo: async (PISISID, PISIPID) => {
    // console.log(PISIPID, PISISID);
    let SELECT_SERVICE_INFO_QUERY = process.env.SELECT_SERVICE_INFO.replace(
      "<PISISID>",
      PISISID
    ).replace("<PISIPID>", PISIPID);

    try {
      const [info] = await promise_pool.query(SELECT_SERVICE_INFO_QUERY);

      return [null, info[0]];
    } catch (e) {
      console.log(e.sqlMessage);
      return [e.sqlMessage];
    }
  },
  insertIntoUnsub: async (msisdn, service, channel) => {
    try {
      const [ok] = await promise_pool.query(
        `${process.env.INSERT_INTO_UNSUB_LOGS.replace(
          "<M_DEACT>",
          channel
        )}`,
        [msisdn, service]
      );

      return [null, "Inserted into unsubscription successfully"];
    } catch (e) {
      console.log(e.sqlMessage);
      return [e.sqlMessage];
    }
  },
  deleteFromSubscription: async (msisdn, pisisid) => {
    try {
      const [result] = await promise_pool.query(
        `${process.env.DELETE_FROM_SUB_TABLE}`,
        [msisdn, pisisid]
      );
      return [null, "Deleted form subscription successfully"];
    } catch (e) {
      console.log(e);
      return [e.sqlMessage];
    }
  },
  checkSubscription: async (msisdn) => {
    try {
      const [exist] = await promise_pool.query(process.env.CHECK_SUBSCRIPTION, [
        msisdn,
      ]);
      return [null, exist[0]];
    } catch (e) {
      return [e.sqlMessage];
    }
  },
  checkBillingSuccessExist: async (
    msisdn,
    service,
  ) => {
    try {
      const [row] = await promise_pool.query(
        process.env.checkBillingSuccessExist,
        [msisdn, service]
      );
      return [null, row[0]?.exist ?? 0]
    } catch (e) {
      console.log(e)
      return [e]
    }
  },
  insertIntoTblSubscription: async (payload) => {
    // console.log("SUB_PAY_LOAD", payload)
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_TABLE_SUBSCRIPTION,
        [
          payload.msisdn,
          payload.type_event,
          payload.mAct,
          payload.autorenew,
          payload.packType,
          payload.trxid,
          payload.startdate,
          payload.startdate,
          payload.enddate,
          payload.amount,
          payload.network,
          payload.service,
	  payload.pisisid
        ]
      );
      return [null, "Inserted subscription successfully"];
    } catch (e) {
      return [e.sqlMessage];
    }
  },
  updateTableSubscription: async (payload) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_TBL_SUBSCRIPTION,
        [
          payload.type_event,
          payload.trxid,
          payload.startdate,
          payload.enddate,
	  payload.amount,
          payload.msisdn,
	  payload.pisisid
        ]
      );
      return [null, "Updated subscription successfully"];
    } catch (e) {
      return [e.sqlMessage];
    }
  },
  insertIntoBillingSuccess: async (payload) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_BILLING_SUCCESS_LOGS,
        [
          payload.msisdn,
          payload.type_event,
          payload.mAct,
          payload.autorenew,
          payload.packType,
          payload.trxid,
          payload.amount,
          payload.startdate,
          payload.enddate,
          payload.callback_response,
          payload.network,
          payload.service,
        ]
      );
      return [null, "Saved billing logs successfylly"];
    } catch (e) {
      console.log("BILLING LOGS ERROR", e.sqlMessage);
      return e.sqlMessage;
    }
  },
  getRandomWelcomeQuestion: async (msisdn) => {
    let RANDOM_SMS_QUERY = process.env.SELECT_WELCOME_QUESTION_SMS.replaceAll(
      "<MSISDN>",
      msisdn
    );

    console.log("QUES_QUERY", RANDOM_SMS_QUERY);

    try {
      const [row] = await promise_pool.query(RANDOM_SMS_QUERY);
      return [null, row[0]];
    } catch (e) {
      console.log(" ERROR_AT_GETTING_WELCOME_SMS");
      return [e];
    }
  },
  insertIntoUserSession: async (
    msisdn,
    first_question_id,
    first_correct_option,
    is_First_ans_correct,
    trxid,
    first_question,
    sms_key
  ) => {
    try {
      const [ok] = await promise_pool.query(
        "INSERT INTO tbl_user_session SET ?",
        {
          msisdn: msisdn,
          first_question_id,
          is_First_ans_correct,
          first_correct_option,
          trxid,
          first_question,
          sms_key,
        }
      );
      return [null, "Successfully saved in user logs"];
    } catch (e) {
      console.log("ERROR_IN_USER_SESSION", e);
      return [e];
    }
  },
  updateUserSessionOnAnswer: async (ansObj, msisdn) => {
    let UPDATE_USER_SESSION_QUERY =
      process.env.UPDATE_USER_SESSION_ON_ANSWER.replace(
        "<COLOUMN>",
        Object.keys(ansObj)[0]
      )
        .replace("<IS_CORRECT>", Object.values(ansObj)[0])
        .replace("<MSISDN>", msisdn);

    console.log({
      UPDATE_USER_SESSION_QUERY,
    });
    try {
      const [ok] = await promise_pool.query(UPDATE_USER_SESSION_QUERY);
      return [null, "Updated user session success fully"];
    } catch (e) {
      console.log("ERROR_IN_UPDATE_USER_SESSION", e);
      return [e];
    }
  },
  updateUserSessionWithNewQuestion: async (
    second_question_id,
    is_second_ans_correct,
    second_correct_option,
    second_question,
    msisdn
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_USER_SESSION_WITH_NEW_QUESTION,
        [
          second_question_id,
          is_second_ans_correct,
          second_correct_option,
          second_question,
          msisdn,
        ]
      );
      console.log("UPDATED USER SESSION SUCCESSFULLY ->", [msisdn]);
      return [null, "Successfully updated new question"];
    } catch (e) {
      console.log("ERROR IN UPDATING USER SESSION ->");
      throw new Error("error in update user session with new values " + e);
    }
  },
  checkPendingAnswers: async (msisdn) => {
    let CHECK_PENDING_ANSWERS = process.env.SELECT_FROM_USER_SESSION.replace(
      "<MSISDN>",
      msisdn
    );

    console.log({
      CHECK_PENDING_ANSWERS,
    });
    try {
      const [result] = await promise_pool.query(CHECK_PENDING_ANSWERS);

      console.log(result);
      return [null, result[0]];
    } catch (err) {
      console.log("GOT_ERROR_IN_PENDING_CHECK", err);
      return [err, null];
    }
  },
  insertIntoUserLogsOnAllQuestionAsked: async (msisdn) => {
    var querys = [
      process.env.INSERT_INTO_USER_LOGS,
      process.env.DELETE_FROM_USER_SESSION,
    ];

    const result = querys.map(async (current) => {
      let selectedQuery = current.replace("<MSISDN>", msisdn);

      console.log("USER_SESSION_END_QUERYS", selectedQuery);

      try {
        const [ok] = await promise_pool.query(selectedQuery);

        return [null, "SUCCESS"];
      } catch (e) {
        console.log("FAILED TO INSERT USER LOGS", e);
        return [e, null];
      }
    });
    const allDone = await Promise.allSettled(result);
    console.log(allDone);
    return true;
  },
  deleteFormSmsPending: async (
    msisdn, 
    service
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FROM_SMS_PENDING_ALL,
        [ msisdn, service]
      );
      return [null, "Deleted form sms pending"]
    } catch (e) {
      console.log(e);
      return [e]
    }
  },
  checkExistingSub: async (msisdn, service) => {
    console.log(process.env.CHECK_EXISTING_SUB)
    return new Promise(
      (res, rej) => {
        pool.query(
          process.env.CHECK_EXISTING_SUB,
          [ msisdn, service ],
          (err, exist) => {
            if(err) return res([err, null]);
            return res([null, exist[0]?.EXIST || 0])
          }
        )
      }
    )
  }
};
