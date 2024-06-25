const express = require('express');
const {body} = require("express-validator");
const router = express.Router();
const adsController = require("../controllers/ads");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");
const upload = require("../config/multer");


router.get("/",authenticate,adsController.getAds)
router.delete("/:adId",authenticate,adminCheck,adsController.deleteAd)
router.post("/", authenticate,adminCheck,upload.single("ad_image"),adsController.createAd);

module.exports = router;
