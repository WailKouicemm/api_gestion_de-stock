const express = require('express');
const {body} = require("express-validator");
const router = express.Router();
const feePaymentsController = require("../controllers/fee-payments");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");



router.get("/",authenticate,adminCheck,feePaymentsController.getFeePayments);


module.exports = router;
