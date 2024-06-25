const express = require('express');
const {body} = require("express-validator");
const router = express.Router();
const productsController = require("../controllers/products");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");


router.get("/",authenticate,adminCheck,productsController.getProducts);


module.exports = router;
