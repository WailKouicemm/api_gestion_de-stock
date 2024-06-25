const { STRING, TEXT, BOOLEAN} = require('sequelize');
const db = require('../../config/connectDB');

const StoreNotification = db.define('store_notification', {
    id: {
        type: STRING,
        primaryKey: true,
        allowNull: false,
    },
    title:{
        type:STRING,
        allowNull:false
    },
    content:{
        type:STRING,
        allowNull:false,
    },
    seen:{
        type:BOOLEAN,
        allowNull:false,
        defaultValue:false
    },
    icon:{
        type:STRING,
        allowNull:false
    }

},{updatedAt:false,createdAt:true});

module.exports = StoreNotification;
