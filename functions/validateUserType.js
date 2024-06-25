const CustomError = require("../models/error/CustomError");

module.exports = (userType)=>{
    return req.user.type === userType;
}