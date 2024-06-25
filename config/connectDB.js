const Sequelize = require('sequelize');
const db = new Sequelize(process.env.DB_URI, { logging: false });



module.exports = db;