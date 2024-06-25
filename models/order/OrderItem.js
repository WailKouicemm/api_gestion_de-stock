const { INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const OrderItem = db.define('order_item', {
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

module.exports = OrderItem;
