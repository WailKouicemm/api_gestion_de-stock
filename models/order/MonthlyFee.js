const { STRING, ENUM, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const MonthlyFee = db.define('monthly_fee', {
    id: {
        type: STRING,
        primaryKey: true,
    },
    amount:{
        type:INTEGER.UNSIGNED,
        allowNull:false
    },

},{createdAt:true,updatedAt:false});

module.exports = MonthlyFee;
