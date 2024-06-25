const { STRING} = require('sequelize');
const db = require('../../config/connectDB');

const StorePolicy = db.define('store_policies', {
    id: {
        type: STRING,
        primaryKey: true,
    },
    title:{
        type:STRING,
        allowNull:false,
    },
    content:{
        type:STRING,
        allowNull: false,
    }
},{updatedAt:false,createdAt:true,freezeTableName:true});

module.exports = StorePolicy;
