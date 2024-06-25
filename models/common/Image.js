const { STRING, TEXT, ENUM, BOOLEAN} = require('sequelize');
const db = require('../../config/connectDB');

const Image = db.define('image', {
    id: {
        type: STRING,
        primaryKey: true,
        allowNull: false,
    },
    url:{
        type:STRING,
        allowNull:false
    },
    type:{
        type:ENUM("PRIVATE","PUBLIC"),
        defaultValue:"PRIVATE"
    },
    name_ar:{
        type:STRING,
        allowNull:true,
    },
    name_en:{
        type:STRING,
        allowNull:true,
    },
    deleted:{
        type:BOOLEAN,
        defaultValue: false,
    },


},{timestamps:false});

module.exports = Image;
