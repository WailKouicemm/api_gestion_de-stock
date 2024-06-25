const express = require('express');
const {body} = require("express-validator");
const router = express.Router();
const imagesController = require("../controllers/images");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");
const upload = require("../config/multer");

router.delete("/:imageId",authenticate,adminCheck,imagesController.deleteImage);
router.patch("/:imageId",authenticate,adminCheck,imagesController.updateImage);
router.post("/",authenticate,adminCheck,upload.array("images"),imagesController.addImages);
router.get("/",imagesController.getImages);


module.exports = router;
