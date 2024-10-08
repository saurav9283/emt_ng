const { promise_pool } = require("../../database");

module.exports = {
  getTrxid: async (msisdn) => {
    try {
      const [row] = await promise_pool.query(
        `SELECT trxid FROM tbl_subscription WHERE msisdn = '${msisdn}' and service like '%Instant%'`
      );
  
      return [null, row[0].trxid];
    } catch (e) {
      console.log(e);
      return [e];
    }
  },
  getCurrentRevenue : async () => {
    try {
      const [row] = await promise_pool.query(process.env.GET_CURRENT_REVENUE);
      console.log("CURRENT REVENUE ->", row);
      return [null, row[0]?.total_revenue ?? 0];
    } catch (e) {
      console.log(e);
      return [e];
    }
  },

  checkifInstantSessionExist: async (
    msisdn, 
    trxid
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.CHECK_EXISTING_INSTANCE_SESSION,
        [msisdn],
      );
      console.log(ok)
      return [null, ok[0]?.SESSION_EXIST ?? 0];
    } catch (error) {
      console.log(error, "IN UPDATE INSTANT LOGS");
      return [error, null];
    }
  },
  insertInstantGameLogs: async (
    msisdn,
    trxid,
    pisisid,
    pisipid,
    type,
    status
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.insertInstantlogs,
        [msisdn, trxid, pisisid, pisipid, type, status]
      );
      console.log("INSERTED INSTANT GAME LOGS ->")
      return [null, "Updated instant session"];
    } catch (error) {
      console.log(error, "IN UPDATE INSTANT LOGS");
      return error;
    }
  },
  updateInstantLosg: async (msisdn, status) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.UPDATE_INSTANT_SESSION.replace("<STATUS>", status),
        [msisdn]
      );
      return [null, "Updated instant session"];
    } catch (error) {
      console.log(error, "IN UPDATE INSTANT LOGS");
      return error;
    }
  },
  insertIntoInstantLogs: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_INSTANT_LOGS,
        [msisdn]
      );
      return [null, "Inserted instant logs"];
    } catch (e) {
      console.log(e, "IN INSERT INTO TBL INSTANT LOGS");
      return [e];
    }
  },
  deleteFromInstantLogs: async (msisdn) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.DELETE_FOR_INSTANT_SESSION,
        [msisdn]
      );
      return [null, "Deleted instant session"];
    } catch (e) {
      console.log(e, "IN INSTANT QUERIES");
      return [e];
    }
  },

  insertIntoInstantSession: async (
    msisdn,
    trxid,
    pisisid,
    pisipid,
    type,
    status
  ) => {
    try {
      const [ok] = await promise_pool.query(
        process.env.INSERT_INSTANT_SESSION_LOGS,
        [msisdn, trxid, pisisid, pisipid, type, status]
      );
      return [null, "SUCCESS"];
    } catch (e) {
      console.log(e, "ERROR IN CREATING SESSION");
      return [null, e];
    }
  },
  getCurrentDayWinner: async () => {
    try {
      const [row] = await promise_pool.query(
        process.env.CHECK_TODAY_WINNER
      );
      return [null, row]
    } catch (e) {
      console.log(e);
      return [e]
    }
  },
  insertIntoTblWinner: async (
    msisdn, 
    airtime,
    status
  ) => {
    try {
       const [ok] = await promise_pool.query(
        process.env.INSERT_INTO_TBL_WINNER_INSTANT,
        [
          msisdn, 
          airtime,
          status
        ]
       );
       return [null, "Inserted into tbl winner logs"]
    } catch(e) {
      console.log(e);
      return [e]
    }
  }
};
