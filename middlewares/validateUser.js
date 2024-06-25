const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
const SystemUsersType = require("../models/common/SystemUserTypes");
require("express-async-errors");
module.exports = async (req,res,next)=>{
    const {storeId,clientId} = req.params;
    if (req.user.type===SystemUsersType.ADMIN){
        next();
        return;
    }
    if (req.user.type===SystemUsersType.STORE&&clientId){

        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
    if (req.user.type===SystemUsersType.CLIENT&&storeId){

        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
    if (clientId && clientId!==req.user.id.toString()){
        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
    if (storeId && storeId!==req.user.id.toString()){
        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }

    next()
}