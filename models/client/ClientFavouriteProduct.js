const { INTEGER} = require('sequelize');
const db = require('../../config/connectDB');

const ClientFavouriteProduct = db.define('client_favourite_product', {
    id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement:true,
        allowNull: false,
    },
},{timestamps:false});

module.exports = ClientFavouriteProduct;
