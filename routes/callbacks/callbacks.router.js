const { callbackNotification } = require("./callbacks.controller");

const router = require("express").Router();

router.post("/", callbackNotification);

module.exports = router;
