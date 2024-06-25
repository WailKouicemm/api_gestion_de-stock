const { STRING, ENUM} = require('sequelize');
const db = require('../../config/connectDB');

const Facture = db.define('facture', {
    id: {
        type: STRING,
        primaryKey: true,
        allowNull: false,
    },
    type:{
        type:ENUM("DELIVERY","COMPLETED"),
        allowNull: false,
    }

},{timestamps:false});

module.exports = Facture;
