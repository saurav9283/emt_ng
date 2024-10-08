const { fetchDetails } = require("./checkSub.services");

module.exports = {
  checkVideoPortalSub: async (req, res) => {
    const { msisdn } = req.body;

    const [e1, user] = await fetchDetails(msisdn);

    if (e1) return res.status(500).json({ result: 0, error: e1 });
    //    not exist
    if (user.length === 0)
      return res.status(200).json({ result: 0, msg: "User does not exist" });

    return res.json({
      result: 1,
      userResult: user[0],
    });
  },
};
