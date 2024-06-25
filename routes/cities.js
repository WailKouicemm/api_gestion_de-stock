const express = require('express');
const {body} = require("express-validator");

const citiesController = require("../controllers/cities");
const requestValidation = require("../middlewares/requestValidation");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");
const router = express.Router();

router.get("/", requestValidation, citiesController.getAllCities);
router.post("/", authenticate,adminCheck,[body("name").notEmpty(),body("name_ar").notEmpty()],requestValidation, citiesController.addCity);


module.exports = router;
