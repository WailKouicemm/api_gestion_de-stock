const { STRING} = require('sequelize');
const db = require('../../config/connectDB');
const Cart = db.define('cart', {
    id: {
        type: STRING,
        primaryKey: true,
        allowNull: false,
    },
});

module.exports = Cart;
