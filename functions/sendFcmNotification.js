const fcm = require("../config/fcmConfig");
const admin = require("firebase-admin");

const sendNotification = (deviceTokens, notification, data) => {
    const message = {
        tokens: deviceTokens,
        notification,
        data,
        android: {
            priority: "high",
            notification: {
                sound: "sound",


            }
        },
        apns: {
            headers: {"apns-priority": '10'},
            payload: {aps: {sound: "sound.wav"}}
        }

    }
    admin.messaging().sendEachForMulticast(message).then(response => {
    });
}
module.exports = sendNotification
