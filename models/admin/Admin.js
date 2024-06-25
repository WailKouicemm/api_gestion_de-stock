const { STRING, INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const Admin = db.define('admin', {
    id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement:true
    },
    phone_number: {
        type: STRING,
        allowNull: false,
    },
    email: {
        type: STRING,
        allowNull: false,
    },
    password: {
        type: STRING,
        allowNull: false,
    },
    name: {
        type: STRING,
        allowNull: false,
    },
},{timestamps:false});

module.exports = Admin;
