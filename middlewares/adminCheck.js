const CustomError = require("../models/error/CustomError");
const SystemUserTypes = require("../models/common/SystemUserTypes");
const ErrorMessage = require("../models/error/ErrorMessage");
module.exports = (req,res,next)=>{
    if (req.user.type !== SystemUserTypes.ADMIN){
        throw new CustomError(403,new ErrorMessage("Not authorized.","غير مصرح به"));
    }
    next()
}