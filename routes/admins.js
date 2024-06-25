const express = require('express');
const {body} = require("express-validator");
const requestValidation = require("../middlewares/requestValidation");
const adminsController = require("../controllers/admin/admins");
const router = express.Router();

router.post("/login", [body("login").notEmpty(), body("password").notEmpty()], requestValidation, adminsController.login);

module.exports = router;
