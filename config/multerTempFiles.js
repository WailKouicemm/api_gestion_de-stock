const multer = require("multer");
const path = require("path");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "/temp"));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.mimetype.split("/")[1]);
    }
});


const uploadTemp = multer({
    storage: storage, fileFilter(req, file, callback) {

        console.log(file.mimetype);
        if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            return callback(null, true);
        }
        callback(new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح")));
    }
});

module.exports = uploadTemp;


