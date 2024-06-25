const { STRING, FLOAT, INTEGER, ARRAY, BOOLEAN} = require('sequelize');
const db = require('../../config/connectDB');


const Product = db.define('product', {
    id: {
        type: STRING,
        primaryKey: true,
    },
    price: {
        type: FLOAT,
        allowNull: false,
    },
    unit_price: {
        type: FLOAT,
        allowNull: false,
    },
    name_ar:{
        type:STRING,
        allowNull:false,
    },
    name_en:{
        type:STRING,
        allowNull:false,
    },
    options:{
        type:STRING,
        allowNull:false
    },
    special_offer:{
        type:BOOLEAN,
        defaultValue:false
    },
    deleted:{
        type:BOOLEAN,
        defaultValue:false
    }
});

module.exports = Product;
