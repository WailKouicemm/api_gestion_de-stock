const express = require('express');
const {body} = require("express-validator");
const router = express.Router();
const statsController = require("../controllers/admin/stats");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");

router.get("/",statsController.getStats)


module.exports = router;
