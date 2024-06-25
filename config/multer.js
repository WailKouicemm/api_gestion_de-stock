const multer = require("multer");
const path = require("path");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "/storage"));
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);

    }
});


const upload = multer({
    storage: storage, fileFilter(req, file, callback) {
        const allowedFileTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/tiff',
            'image/bmp',
            'image/svg+xml',
            'image/raw',
            'image/vnd.adobe.photoshop',
            'application/illustrator',
            'application/postscript',
            'application/pdf',
            'image/webp',
        ];

        if (allowedFileTypes.includes(file.mimetype)) {
            return callback(null, true); // Accept the file
        }
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png"||file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            return callback(null, true);
        }
        callback(new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح")));
    }
});

module.exports = upload;