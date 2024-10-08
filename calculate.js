const { promise_pool } = require("./database");

module.exports = {
  makeReport: async (service) => {
    for (let i = 0; i < 1; i++) {
      let query = process.env.fetchActiveBase
        .replaceAll("<SERVICE>", service)
        .replaceAll("<DAY>", i);
      //   console.log(query);
      try {
        const [row] = await promise_pool.query(query);
        console.log("mis length =>", row.length);
        if (row.length > 0) {
          row.map(async (prop) => {
            //console.log(prop);
            const [e1, ok] = await insertIntoMis(
              prop.mis_date,
              prop.active_base,
              prop.total_base,
              prop.service,
              prop.total_revenue
            );
            // console.log(e1, ok);
            return true;
          });
        }
      } catch (e) {
        // console.log(e);
        return false
      }
    }
  },
};

async function insertIntoMis(
  mis_date,
  active_base,
  total_base,
  service,
  total_revenue
) {
  try {
    const [row] = await promise_pool.query(process.env.checkExistingMisdata, [
      mis_date,
      service,
    ]);
    if (row.length > 0) {
      console.log("Mis exist => updating =>", row.length);
      const [o] = await promise_pool.query(process.env.updateMisTbl, [
        active_base,
        total_base,
        total_revenue,
        mis_date,
        service,
      ]);
      return [null, "Updated mis successfully"];
    }
    const [ok] = await promise_pool.query(process.env.InsertIntoTblMis, [
      mis_date,
      active_base,
      total_base,
      service,
      total_revenue,
    ]);
    return [null, "Inserted uccessfully =>"];
  } catch (e) {
    return [e];
  }
}
