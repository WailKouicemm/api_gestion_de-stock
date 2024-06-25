const { STRING,ENUM, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const ClientStatus = require("./ClientStatus");

const Client = db.define('client', {
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
    email: {
        type: STRING,
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
        type:ENUM(ClientStatus.ACTIVE,ClientStatus.BLOCKED,ClientStatus.SUSPENDED),
        defaultValue:ClientStatus.ACTIVE,
    },

});


module.exports = Client;
