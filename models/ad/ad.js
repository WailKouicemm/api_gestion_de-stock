const { INTEGER, BOOLEAN} = require('sequelize');
const db = require('../../config/connectDB');
const Ad = db.define('ad', {
    id: {
        type: INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement:true
    },
    deleted:{
        type:BOOLEAN,
        defaultValue:false,
    }


},{updatedAt:false});

module.exports = Ad;
