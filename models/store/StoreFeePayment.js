const { STRING, INTEGER, ENUM} = require('sequelize');
const db = require('../../config/connectDB');
const StoreFeePaymentStatus = require("./StoreFeePaymentStatus");

const StoreFeePayment = db.define('store_fee_payments', {
    id: {
        type: STRING,
        primaryKey: true,
    },
    amount:{
        type:INTEGER,
        allowNull:null,
    },
    status:{
        type:ENUM(StoreFeePaymentStatus.APPROVED,StoreFeePaymentStatus.PENDING,StoreFeePaymentStatus.REJECTED),
        defaultValue:StoreFeePaymentStatus.PENDING
    }
},{updatedAt:true,createdAt:true,freezeTableName:true});

module.exports = StoreFeePayment;
