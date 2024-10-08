const { loginController, createUser } = require("./login.controller");

const router = require("express").Router();

router.post("/login", loginController);
router.post("/register", createUser);

module.exports = router;
