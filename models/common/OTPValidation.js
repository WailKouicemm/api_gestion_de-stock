const { STRING, DATE} = require('sequelize');
const db = require('../../config/connectDB');

const OTPValidation = db.define('otp_validation_code', {
    id: {
        type: STRING,
        primaryKey: true,
        allowNull: false,
    },
    code:{
        type:STRING,
        allowNull:false
    },
    expiresAt:{
        type:DATE,
        allowNull:false,
    },
    phone_number:{
        type:STRING,
        allowNull:false,
    }

},{updatedAt:false,createdAt:true});

module.exports = OTPValidation;
