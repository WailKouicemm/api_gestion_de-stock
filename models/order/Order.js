const { STRING, TEXT, ENUM, INTEGER, FLOAT, DATE, DOUBLE} = require('sequelize');
const db = require('../../config/connectDB');
const OrderStatus = require("./OrderStatus");
const Order = db.define('orders', {
    id: {
        type: INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement:true,
    },
    status:{
      type:ENUM(OrderStatus.PENDING,OrderStatus.COMPLETED,OrderStatus.SHIPPED,OrderStatus.CANCELED),
      defaultValue:OrderStatus.PENDING
    },
    amount:{
        type:INTEGER.UNSIGNED,
        allowNull: false,
    },
    tax_amount:{
        type:FLOAT,
        allowNull:true
    },
    facture_url:{
        type:STRING,
        allowNull:true,
    },
    shipping_date:{
        type:DATE,
        allowNull:true,
        defaultValue: null,
    },
    lat:{
        type:DOUBLE,
        allowNull:false,
    },
    long:{
      type:DOUBLE,
      allowNull:false,
    },
    notice:{
        type:STRING,
        allowNull:true,
    }
});

module.exports = Order;
