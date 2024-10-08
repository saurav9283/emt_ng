const { promise_pool } = require("../../database")

module.exports = {
    fetchDetails: async (msisdn) => {
        try {
            const [ok] = await promise_pool.query(
                process.env.CHECK_VIDEO_PORTAL_SUB,
                [
                    msisdn
                ]
            );
            return [null, ok]
        } catch (e) {
            console.log(e)
            return [e]
        }
    }
}