const StoreNotification = require("../../models/store/StoreNotification");
const CustomError = require("../../models/error/CustomError");
const ErrorMessage = require("../../models/error/ErrorMessage");

module.exports.getNotifications = async (req, res) => {
    const {storeId} = req.params;
    const {page_size = 12, page = 0} = req.query;
    const notifications = await StoreNotification.findAll({
        where: {storeId},
        order: [["createdAt", "DESC"]],
        limit: Number(page_size),
        offset: Number(page) * Number(page_size)
    });
    res.json({data: {notifications}});
}
module.exports.updateNotificationToSeen = async (req, res) => {
    const {storeId, notificationId} = req.params;
    const notification = await StoreNotification.findOne({
        attributes: ["id", "seen"], where: {
            id: notificationId, storeId
        }
    });
    if (!notification) {
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    notification.seen = true;
    await notification.save();
    res.json({notification});
}