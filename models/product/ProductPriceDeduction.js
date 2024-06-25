const { STRING, DATE, ENUM, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const ProductPriceDeduction = db.define('product_price_deduction', {
    id: {
        type: STRING,
        primaryKey: true,
    },
    type:{
        type:ENUM("FIXED","PERCENTAGE"),
        allowNull: false,
        defaultValue:"FIXED"
    },
    amount:{
      type:INTEGER.UNSIGNED,
      allowNull:false
    },
    expiresAt:{
        type:DATE,
        allowNull:false,
    }

},{updatedAt:false,createdAt:true});

module.exports = ProductPriceDeduction;
