const { STRING,ENUM, INTEGER, BOOLEAN} = require('sequelize');
const db = require('../../config/connectDB');

const StoreStatus = require("./StoreStatus");

const Store = db.define('store', {
    id: {
        type: INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement:true,
        allowNull: false,
    },
    phone_number: {
        type: STRING,
        unique:true,
        allowNull: false,
    },
    register_number: {
        type: STRING,
        unique:true,
        allowNull: false,
    },
    tax_number: {
        type: STRING,
        allowNull: true,
    },
    delivery_support_phone_number: {
        type: STRING,
        allowNull: false,
    },
    delivery_administration_phone_number: {
        type: STRING,
        allowNull: false,
    },
    email: {
        type: STRING,
        unique:true,
        allowNull: true,
    },
    password: {
        type: STRING,
        allowNull: false,
    },
    name: {
        type: STRING,
        allowNull: false,
    },
    owner_full_name: {
        type: STRING,
        allowNull: true,
    },
    status:{
        type:ENUM(StoreStatus.ACTIVE,StoreStatus.BLOCKED,StoreStatus.PENDING,StoreStatus.INVISIBLE),
        defaultValue:StoreStatus.PENDING,
    },
    min_order_price:{
        type: INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 250,
    },
    brand:{
        type:BOOLEAN,
        defaultValue:false,
        allowNull:false,
    }
});


module.exports = Store;
