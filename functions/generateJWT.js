const jwt = require('jsonwebtoken');

const generateJWT = (userId,userType) => {
    return jwt.sign({ userId:userId,userType }, process.env.JWT_SECRET);
};

module.exports = generateJWT;