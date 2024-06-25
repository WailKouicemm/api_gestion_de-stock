const { STRING } = require('sequelize');
const db = require('../../config/connectDB');

const City = db.define('cities', {
    name: {
        type: STRING,
        primaryKey: true,
        allowNull: false,
    },
    name_ar:{
        type:STRING,
        allowNull: false,
    }
}, { timestamps: false,freezeTableName:true });

module.exports = City;
