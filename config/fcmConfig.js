const admin = require("firebase-admin");

const serviceAccount = require("./saudi-7faba-firebase-adminsdk-ljdyh-bff1eb2966.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
module.exports = admin;