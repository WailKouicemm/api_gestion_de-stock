const Cart = require("../models/client/Cart");
const Product = require("../models/product/Product");
const Client = require("../models/client/Client");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
const Order = require("../models/order/Order");
const OrderItem = require("../models/order/OrderItem");
const Image = require("../models/common/Image");
const SpecialOfferInfo = require("../models/product/SpecialOfferInfo");
const Store = require("../models/store/Store");
const CartItem = require("../models/client/CartItem");
require("express-async-errors");
const OrderStatus = require("../models/order/OrderStatus");
const sendFCMNotification = require("../functions/sendFcmNotification");
const DeviceToken = require("../models/common/UserDeviceToken");
const fs = require("fs");
const MonthlyFee = require("../models/order/MonthlyFee");
const generateFacture = require("../functions/generateFacture");
const SystemUsersTypes = require("../models/common/SystemUserTypes");
const {v1:idGenerator} = require("uuid");
const {Op, QueryTypes} = require("sequelize");
const db = require("../config/connectDB");


























module.exports.createOrder = async (req, res) => {
    const {clientId} = req.params;
    const {storeId, address,notice} = req.body;
    const store = await Store.findByPk(storeId, {attributes: ["min_order_price"]});
    if (!store) {
        throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
    }
    const cart = await req.user.getCart();
    const cartStoreProducts = await db.query(`
        select * from (
        (select productId as id,quantity from cart_items where cartId="${cart.id}") as c
        natural join
        (select id,price from products where id in (
        select productId from cart_items as d join products  as p on p.id=d.productId and p.storeId=${Number(storeId)} 
        )
        )as f)`, { type: QueryTypes.SELECT })

    if (cartStoreProducts.length === 0) {
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    let amount = 0;
    for (const item of cartStoreProducts) {
        amount += Number(item.price) * Number(item.quantity);
    }
    if (Number(store.dataValues.min_order_price) > Number(amount)) {
        throw new CustomError(400, new ErrorMessage("order amount is less than the store's min price", "مبلغ الطلب أقل من الحد الأدنى للمتجر"));
    }

    if (!(address && address.lat && address.long)) {
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    const order = await Order.create({clientId, storeId, amount, lat: address.lat, long: address.long,notice});
    for (const item of cartStoreProducts) {
        await OrderItem.create({
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity
        });
        await CartItem.destroy({where: {cartId: cart.id, productId: item.id}});
    }
    const storeDeviceTokens = (await DeviceToken.findAll({where: {storeId}})).map(deviceToken => deviceToken.dataValues.token)
    if (storeDeviceTokens.length>0){
        sendFCMNotification(storeDeviceTokens, {
            title: 'You have a new order.',
            body: `${req.user.name} ordered from you.`
        }, {});
    }
    res.json({data: order.id});
}


























































module.exports.getOrders = async (req, res) => {
    const {page_size = 12, page = 0, status,min_date,max_date} = req.query;
    const {storeId, clientId} = req.params;
    let includeItem;
    if (req.user.type !== SystemUsersTypes.ADMIN) {
        if (storeId) {
            includeItem = {
                model: Client,
                attributes: ["phone_number", "name"],
            }
        }
        if (clientId) {
            includeItem = {
                model: Store,
                attributes: ["delivery_support_phone_number", "name"],
            }
        }
    }
    let minDate;
    let maxDate;
    try {
        if (min_date){
            minDate = Date.parse(min_date)
        }
        if (max_date){
            maxDate = Date.parse(max_date)
        }

    }catch (e) {
    }
    
    console.error(minDate);
    console.error(maxDate);

    const orders = await Order.findAll({
        where: {...(clientId && {clientId}),
            ...(storeId && {storeId}),
            ...(status && {status}),
            ...((min_date||max_date)&&{shipping_date:{
                [Op.between]:[minDate?minDate:0,maxDate?maxDate:Date.now()]
            }}),
        },
        limit: Number(page_size),
        offset: Number(page) * Number(page_size),
        order: [["createdAt", "DESC"]],
        include: includeItem
    });

    for (let i = 0; i < orders.length; i++) {
        orders[i].dataValues.products_count = await OrderItem.count({where: {orderId: orders[i].dataValues.id}});
        
        if (req.user.type !== SystemUsersTypes.ADMIN) {
            const orderItem = await OrderItem.findOne({where: {orderId: orders[i].id}})
            orders[i].dataValues.total_price = orders[i].dataValues.amount;
            orders[i].dataValues.first_product = await Product.findOne({
                attributes: [req.language === "ar-SA" ? ["name_ar", "name"] : ["name_en", "name"]], include: {
                    model: Image,
                    attributes: ["url"]
                }, where: {id: orderItem.productId,deleted:{[Op.in]:[true,false]}}
            });
        }
    }
    res.json({data: orders});
}
































module.exports.getOrder = async (req, res) => {
    const {storeId, orderId, clientId} = req.params;
    let includeItem;
    if (req.user.type!==SystemUsersTypes.ADMIN){
        includeItem={
            model: Product,
            attributes: [req.language === "ar-SA" ? ["name_ar", "name"] : ["name_en", "name"], "options", "price", "special_offer"],
            include: [{model: Image, attributes: ["url"]}, {
                model: SpecialOfferInfo,
                attributes: [req.language === "ar-SA" ? ["message_ar", "message"] : ["message_en", "message"],"message_ar","message_en"],
                include: {
                    model: Image,
                    attributes: ["url"],
                    required:false,
                }}]
        }
    }
    const order = await Order.findOne({
        attributes: {exclude: ["createdAt", "updatedAt",  "products.order_item.id"]},
        where: {...(storeId && {storeId}), ...(clientId && {clientId}), id: orderId},
        include: includeItem
    });
    if (!order) {
        throw new CustomError(404, new ErrorMessage("order not found", "الطلب غير موجود"));
    }
    if (req.user.type===SystemUsersTypes.STORE){
        const monthlyFee = await MonthlyFee.findOne({order: [["createdAt", "DESC"]],attributes:{exclude:["id"]}});
        order.dataValues.tax_amount = (Number(monthlyFee.amount) * Number(order.amount)) / 100;
    }
    if (req.user.type!==SystemUsersTypes.ADMIN){
        order.dataValues.products = order.dataValues.products.map((product, index) => {
            return {
                name: product.dataValues.name,
                special_offer_info: product.dataValues.special_offer_info,
                image: product.dataValues.image,
                quantity: product.dataValues.order_item.quantity,
                price: product.dataValues.price,
                options: product.dataValues.options
            }
        });
    }else{
        order.dataValues.products_count = await OrderItem.count({where:{orderId:order.id}});
    }
    res.json({data: order.dataValues});
}






















module.exports.updateOrderStatus = async (req, res) => {
    const {storeId, orderId, clientId} = req.params;
    const {status,notice} = req.body;
    if (!(status in OrderStatus)) {
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    if (status === OrderStatus.PENDING) {
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    const order = await Order.findOne({
        where: {id: orderId, ...(storeId && {storeId}), ...(clientId && {clientId})},
        attributes: ["id", "status", "amount", "clientId", "createdAt", "lat", "long"]
    });
    if (!order) {
        throw new CustomError(404, new ErrorMessage("order not found", "الطلب غير موجود"));
    }
    /*if (order.status === status || order.status === OrderStatus.CANCELED || order.status === OrderStatus.COMPLETED) {
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }*/
    if (clientId && ((order.status === OrderStatus.PENDING && status === OrderStatus.CANCELED) || (order.status === OrderStatus.SHIPPED && status === OrderStatus.COMPLETED))) {
        order.status = status;
        if (status === OrderStatus.CANCELED){
            order.notice = notice?notice:order.notice;
        }
        await order.save();
        return res.json({data: order})
    }
    if (storeId && ((order.status === OrderStatus.PENDING && status === OrderStatus.CANCELED) || (order.status === OrderStatus.PENDING && status === OrderStatus.SHIPPED) || (order.status === OrderStatus.SHIPPED && status === OrderStatus.COMPLETED))) {
        if (status === OrderStatus.SHIPPED) {
            const monthlyFee = await MonthlyFee.findOne({order: [["createdAt", "DESC"]]});
            order.tax_amount =Math.floor( (Number(monthlyFee.amount) * Number(order.amount)) / 100);
            order.shipping_date = new Date();
            const store = await Store.findOne({
                where: {id: storeId},
                attributes: ["name", "delivery_support_phone_number"]
            });

            const products = await db.query(`SELECT name_ar,quantity,price,image_url from
 ( (SELECT productId as id,quantity from order_items where orderId=${order.id}) as a
  NATURAL join
   (SELECT id,name_ar,price,image_url from
    ((SELECT name_ar,id,price,imageId from products) as c 
    NATURAL JOIN
     (SELECT id as imageId,url as image_url from images) as d) ) as b )`, { type: QueryTypes.SELECT })

            const client = await Client.findOne({where: {id: order.clientId}, attributes: ["name", "phone_number"]});
            await generateFacture({
                order: {
                    id: order.id,
                    createdAt: order.createdAt,
                    amount: order.amount,
                    products_count: await OrderItem.count({where: {orderId}}),
                    lat: order.lat,
                    long: order.long,
                    products:products
                },
                store: {
                    name: store.name,
                    delivery_support_phone_number: store.delivery_support_phone_number,
                },
                client: {
                    name: client.name,
                    phone_number: client.phone_number,

                }
            });
        }
        order.status = status;
        order.facture_url = process.env.SERVER_URL + `facture_${order.id}.html`
        if (status === OrderStatus.CANCELED){
            order.notice = notice?notice:order.notice;
        }
        await order.save();
        return res.json({data: order})
    }

    throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
}























module.exports.deleteOrder = async (req, res) => {
    const {orderId} = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) {
        throw new CustomError(404, new ErrorMessage("order not found", "الطلب غير موجود"));
    }
    await OrderItem.destroy({where: {orderId: order.id}});
    await order.destroy();
    res.json({data: order});

}
module.exports.updateOrderFee = async (req,res)=>{
    const {amount} = req.body;
    if (Number(amount)>100){
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    const monthlyFee = await MonthlyFee.create({id:idGenerator(),amount});
    res.json({data:monthlyFee.id});
}

module.exports.getOrderFee = async (req,res)=>{
    const monthlyFee = await MonthlyFee.findOne({order: [["createdAt", "DESC"]],attributes:{exclude:["id"]}});
    res.json({data:monthlyFee});
}