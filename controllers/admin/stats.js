const Store = require("../../models/store/Store");
const Client = require("../../models/client/Client");
const Order = require("../../models/order/Order");
const OrderStatus = require("../../models/order/OrderStatus");
const db = require("../../config/connectDB");
const sequelize = require("sequelize");
const {Op} = require("sequelize");
const {QueryTypes} = require("sequelize");

const Product = require("../../models/product/Product");
module.exports.getStats = async (req,res)=>{
    const clients_count = await Client.count();
    const stores_count = await Store.count({where:{brand:false}});
    const active_orders_count = await Order.count({where:{status:OrderStatus.PENDING}});
    const brands_count = await Store.count({where:{brand: true}});
    const products_count = await Product.count({where:{deleted:false}});
    const todayDate = new Date(new Date().setHours(24, 0, 0, 0));
    const data = (await db.query(`SELECT sum(amount) as profit FROM store_fee_payments WHERE STATUS="APPROVED" and month(updatedAt)=Month(now())`,{type:QueryTypes.SELECT}));
    const month_profit = data?data[0].profit:0;
    const invisible_stores_count = (await db.query(`select count(*) from stores where status="INVISIBLE"`,{type:QueryTypes.SELECT}))[0];
    const oneWeekBeforeDate = new Date(new Date().setDate(todayDate.getDate() - 8));
    const weekly_orders = await Order.findAll({
        attributes: [[sequelize.fn('DATE', sequelize.col('createdAt')), "date"], [sequelize.fn('COUNT', sequelize.col('*')), "count"]],
        where: {
            createdAt: {[Op.between]: [oneWeekBeforeDate, todayDate]}
        },
        group: ["date"]
    });
    let week_orders_stats = {};
    for (const order of weekly_orders) {
        week_orders_stats[new Date(Date.parse(order.dataValues.date)).toLocaleDateString("en-US", {weekday: 'short'}).toLowerCase()] = order.dataValues.count;
    }
    res.json({
        data:{
            products_count,
            clients_count,
            stores_count,
            active_orders_count,
            brands_count,
            week_orders_stats,
            month_profit,
            invisible_stores_count
        }
    })
}