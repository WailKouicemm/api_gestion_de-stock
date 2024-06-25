const {validationResult} = require("express-validator");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
module.exports = (req,res,next)=>{
    const result = validationResult(req);
    if (!result.isEmpty()){
        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
    next()
}