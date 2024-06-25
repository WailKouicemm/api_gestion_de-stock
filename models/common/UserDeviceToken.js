const { STRING, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const DeviceToken = db.define('device_token', {
    id: {
        type: INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement:true
    },
    token:{
        type:STRING,
        unique:false,
        allowNull:false,
    }
},{updatedAt:false,createdAt:true,freezeTableName:true});

module.exports = DeviceToken;
