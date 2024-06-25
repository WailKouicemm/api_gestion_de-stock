const { STRING, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');
const StoreBanner = db.define('store_banner', {
    id: {
        type: INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement:true
    },

},{updatedAt:false});

module.exports = StoreBanner;
