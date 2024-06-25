const jwt = require('jsonwebtoken');
const Client = require('../models/client/Client');
const Admin = require('../models/admin/Admin');
const Store = require('../models/store/Store');
const CustomError = require("../models/error/CustomError");
const UserTypes = require("../models/common/SystemUserTypes");
require("express-async-errors");
const ErrorMessage = require("../models/error/ErrorMessage");
const StoreStatus = require("../models/store/StoreStatus");
const ClientStatus = require("../models/client/ClientStatus");

const authenticate = async (req, res, next) => {
    let token;
    const bearerToken = req.headers?.authorization || req.body.headers?.Authorization;
    if (bearerToken && bearerToken.startsWith('Bearer')) {
        try {
            token = bearerToken.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            switch (decodedToken.userType) {
                case UserTypes.ADMIN:{
                    req.user = await Admin.findByPk(decodedToken.userId);
                    break;
                }
                case UserTypes.STORE:{
                    req.user = await Store.findByPk(decodedToken.userId);
                    break;
                }
                case UserTypes.CLIENT:{
                    req.user = await Client.findByPk(decodedToken.userId);

                    break;
                }
                default:{
                    next(new CustomError(401,new ErrorMessage("Not authorized. Invalid token.","غير مصرح به. الرمز غير صالح")));
                }
            }
            if (!req.user)
                next(new CustomError(401,new ErrorMessage("Not authorized. Invalid token.","غير مصرح به. الرمز غير صالح")));
            req.user.type = decodedToken.userType;
            if (req.user.type!==UserTypes.ADMIN){
                if(req.user.type===UserTypes.STORE){
                    if (![StoreStatus.ACTIVE,StoreStatus.INVISIBLE].includes(req.user.status)){
                    next(new CustomError(403,new ErrorMessage("Not authorized.","غير مصرح به. ")))
                }
                }else {
                    if(req.user.status!==ClientStatus.ACTIVE){
                         next(new CustomError(403,new ErrorMessage("Not authorized.","غير مصرح به. ")))

                    }
                }
                
            }
            next();
        }
        catch (error) {
            next(new CustomError(401,new ErrorMessage("Not authorized. Invalid token.","غير مصرح به. الرمز غير صالح")));
        }
    }
    if (!token) next(new CustomError(401,new ErrorMessage("Not authorized. Invalid token.","غير مصرح به. الرمز غير صالح")));

};

module.exports = authenticate;