const Store = require("../../models/store/Store");
const Image = require("../../models/common/Image");
const Order = require("../../models/order/Order");
const OrderStatus = require("../../models/order/OrderStatus");
const Product = require("../../models/product/Product");
const sequelize = require("sequelize");
const {Op} = require("sequelize");
const StoreNotification = require("../../models/store/StoreNotification");
const StoreBanner = require("../../models/store/StoreBanner");
const calculateOrderAmount = require("../../functions/getOrderAmount");
const StoreFeePayment = require("../../models/store/StoreFeePayment");
const MonthlyFee = require("../../models/order/MonthlyFee");

module.exports.getStats = async (req, res) => {
    const {storeId} = req.params;
    const store = await Store.findByPk(storeId, {attributes: {exclude: ["password", "createdAt", "updatedAt", ""]}});
    store.dataValues.store_image =await Image.findOne({where:{id:store.store_image}});
    const tax =(await MonthlyFee.findOne({order: [["createdAt", "DESC"]],attributes:{exclude:["id"]}})).amount;
    const active_orders_count = await Order.count({where: {storeId, status: OrderStatus.SHIPPED}});
    const pending_orders_count = await Order.count({where: {storeId, status: OrderStatus.PENDING}});
    const total_client_count = await Order.count({distinct: true, col: ["clientId"], where: {storeId}});
    const products_count = await Product.count({where: {storeId, deleted: false}});
    const todayDate = new Date(new Date().setHours(24, 0, 0, 0));
    const oneWeekBeforeDate = new Date(new Date().setDate(todayDate.getDate() - 6));
    const weekly_orders = await Order.findAll({
        attributes: [[sequelize.fn('DATE', sequelize.col('createdAt')), "date"], [sequelize.fn('COUNT', sequelize.col('*')), "count"]],
        where: {
            storeId,
            createdAt: {[Op.between]: [oneWeekBeforeDate, todayDate]}
        },
        group: ["date"]
    });
    const notifications_count = await StoreNotification.count({where: {storeId, seen: false}});
    const currentMonth = new Date(new Date(new Date().setDate(1)).setHours(1, 0, 0, 0));
    let week_orders_stats = {};
    for (const order of weekly_orders) {
        week_orders_stats[new Date(Date.parse(order.dataValues.date)).toLocaleDateString("en-US", {weekday: 'short'}).toLowerCase()] = order.dataValues.count;
    }
    const month_orders = await Order.findAll({
        where: {createdAt: {[Op.gte]: currentMonth}, storeId, status: [OrderStatus.COMPLETED,OrderStatus.SHIPPED]}, include: {
            model: Product,
            attributes: ["price"]
        }
    });
    const banners_count = await StoreBanner.count({where: {storeId}});

    const month_profit = calculateOrderAmount(month_orders);

    const lastFeePayment = (await StoreFeePayment.findOne({
        where: {storeId,status:"APPROVED"},
        order: [["createdAt", "DESC"]],
        attributes: ["createdAt"]
    }));
    let lastFeePaymentDate;
    if (lastFeePayment) {
        lastFeePaymentDate = lastFeePayment.createdAt;
    }
    const orders = await Order.findOne({
        where: {
            shipping_date: {
                ...((lastFeePayment && {[Op.between]: [lastFeePaymentDate, new Date()]}) || {[Op.lt]: new Date()})
            }, storeId, [Op.or]:[{status: OrderStatus.COMPLETED},{status:OrderStatus.SHIPPED}]
        },
        attributes: [[sequelize.fn("SUM",sequelize.col("tax_amount")),"taxes_amount"]]
    });
    const unpaid_taxes_amount = Number(Number(orders.dataValues.taxes_amount||0).toFixed(2));
    res.json({
        data: {
            stats: {
                active_orders_count,
                total_client_count,
                products_count,
                pending_orders_count,
                weekly_orders: week_orders_stats,
                notifications_count,
                unpaid_taxes_amount,
                month_profit,
                banners_count,
                tax,
            }, store,
        }
    });
}
