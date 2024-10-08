const { checkVideoPortalSub } = require("./checkSub.controller");

const router = require("express").Router();

router.post("/", checkVideoPortalSub);

module.exports = { checkSub: router };
