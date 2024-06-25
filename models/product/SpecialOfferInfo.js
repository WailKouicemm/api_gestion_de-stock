const { STRING, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const SpecialOfferInfo = db.define('special_offer_info', {
    id: {
        type: INTEGER.UNSIGNED,
        primaryKey: true,
        allowNull: false,
        autoIncrement:true,
    },
    message_ar:{
        type:STRING,
        allowNull:false
    },
    message_en:{
        type:STRING,
        allowNull:false
    },

},{updatedAt:false,createdAt:true});

module.exports = SpecialOfferInfo;
