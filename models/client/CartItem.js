const { INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const CartItem = db.define('cart_item', {
    id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement:true,
        allowNull: false,
    },
    quantity:{
        type:INTEGER.UNSIGNED,
        allowNull:false,
        defaultValue:1
    }
},{timestamps:false});

module.exports = CartItem;
