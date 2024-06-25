const CustomError = require("../models/error/CustomError");
const {MulterError} = require("multer");
const ErrorMessage = require("../models/error/ErrorMessage");

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof MulterError){
        const error =new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        const message = req.language === "ar-SA" ? error.message.message_ar:error.message.message_en
        return res.status(error.statusCode).json({message})
    }
    if (err instanceof CustomError){
        const message = req.language === "ar-SA" ? err.message.message_ar:err.message.message_en
        let status;
        if (err.statusCode===403){
            status  = req.user.status;
        }
        return res.status(err.statusCode).json({message,status});
    }
    res.status(500).json({message:req.language !== "ar-SA" ? "internal server error":"حدث خلل في السرفر"});
};

module.exports = errorHandler;