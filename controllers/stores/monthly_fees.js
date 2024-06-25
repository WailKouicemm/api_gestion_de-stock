require("express-async-errors");
const StoreFeePayment = require("../../models/store/StoreFeePayment");
const Order = require("../../models/order/Order");
const {Op} = require("sequelize");
const OrderStatus = require("../../models/order/OrderStatus");
const {v1: idGenerator} = require("uuid");
const sequelize = require("sequelize");
const CustomError = require("../../models/error/CustomError");
const ErrorMessage = require("../../models/error/ErrorMessage");
const payTabs = require("../../config/payTabsConfig");
const Store = require("../../models/store/Store");
const StoreStatus = require("../../models/store/StoreStatus");
const SystemUserTypes = require("../../models/common/SystemUserTypes");
const StoreFeePaymentStatus = require("../../models/store/StoreFeePaymentStatus");
const path = require("path");
const ejs = require("ejs");
module.exports.getMonthlyPayments = async (req, res) => {
    const {storeId} = req.params;
    const {page=0,page_size=12} = req.query;
    const fee_payments = await StoreFeePayment.findAll({
        where: {storeId,status:StoreFeePaymentStatus.APPROVED},
        attributes: {exclude: ["storeId"]},
        order: [["createdAt", "DESC"]],
        limit:Number(page_size),
        offset:Number(page)*Number(page_size)
    });
    let lastFeePaymentDate;
    if (fee_payments.length > 0) {
        const lastFeePayment = fee_payments[0];
        lastFeePaymentDate = lastFeePayment.createdAt
    }
    const orders = await Order.findOne({
        where: {
            shipping_date: {
                ...((lastFeePaymentDate && {[Op.between]: [lastFeePaymentDate, new Date()]}) || {[Op.lt]: new Date()})
            }, storeId, [Op.or]: [{status: OrderStatus.COMPLETED}, {status: OrderStatus.SHIPPED}]
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("tax_amount")), "taxes_amount"]]
    });
    let unpaid_taxes_amount = Number(Number(orders.dataValues.taxes_amount ? orders.dataValues.taxes_amount : 0).toFixed(2));
    res.json({data: {fee_payments, unpaid_taxes_amount}});
}
module.exports.monthlyPaymentFacture = async (req, res) => {
    const {storeId, feePaymentId} = req.params;
    const store = await Store.findByPk(storeId);
    if (!store) {
        throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
    }
    const feePayment = await StoreFeePayment.findOne({where: {storeId, id: feePaymentId}});
    if (!feePayment) {
        throw new CustomError(404, new ErrorMessage("fee payment not found", "فشل في العثور على دفعة الرسوم"));
    }
    await setTimeout(()=>{
        if (feePayment.dataValues.status!==StoreFeePaymentStatus.APPROVED){
            throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }
        ejs.renderFile(path.join(__dirname,"..", "..", "assets", "feePaymentInvoiceSkin.ejs"), {
            store: store.dataValues,
            feePayment: feePayment.dataValues
        }, {}, (err,str) => {
            res.send(str);
        });
    },req.method==="POST"?2000:0)
}
module.exports.updateFeePayment = async (req, res) => {
    const {storeId, feePaymentId} = req.params;
    const {tran_ref, cart_id, payment_result} = req.body;
    if (cart_id !== feePaymentId) {
        new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    if (!tran_ref) {
        new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    payTabs.validatePayment(tran_ref, async (data) => {
        if (data) {
            const store = await Store.findByPk(storeId);
            if (!store) {
                new CustomError(404, new ErrorMessage("store not found", "طلب غير صالح"));
            }
            const feePayment = await StoreFeePayment.findOne({where: {storeId, id: feePaymentId}});
            if (!feePayment) {
                new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
            }
            if (payment_result?.response_status === "A") {
                feePayment.status = StoreFeePaymentStatus.APPROVED;
                store.status = StoreStatus.ACTIVE;
                await store.save();
            } else {
                feePayment.status = StoreFeePaymentStatus.REJECTED;
            }
            await feePayment.save();
            res.json({message: "Done"});
        } else {
            new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }
    })
}
module.exports.createMonthlyPayment = async (req, res) => {
    const {storeId} = req.params;
    const store = await Store.findByPk(storeId);
    const fee_payments = await StoreFeePayment.findOne({
        where: {storeId},
        attributes: {exclude: ["storeId"]},
        order: [["createdAt", "DESC"]]
    });
    let lastFeePaymentDate;
    if (fee_payments && fee_payments.dataValues.status === StoreFeePaymentStatus.APPROVED) {
        const lastFeePayment = fee_payments;
        lastFeePaymentDate = lastFeePayment.createdAt
    }
    const orders = await Order.findOne({
        where: {
            shipping_date: {
                ...((lastFeePaymentDate && {[Op.between]: [lastFeePaymentDate, new Date()]}) || {[Op.lt]: new Date()})
            }, storeId, [Op.or]: [{status: OrderStatus.COMPLETED}, {status: OrderStatus.SHIPPED}]
        },
        attributes: [[sequelize.fn("SUM", sequelize.col("tax_amount")), "taxes_amount"]]
    });
    console.error(orders.dataValues);
    if (orders?.dataValues?.taxes_amount) {
        if (req.user.type === SystemUserTypes.ADMIN) {
            const fee_payment = await StoreFeePayment.create({
                storeId,
                id: idGenerator(),
                amount: orders.dataValues.taxes_amount,
                status: StoreFeePaymentStatus.APPROVED,
            });
            store.status = StoreStatus.ACTIVE;
            await store.save();
            return res.json({data: fee_payment});
        }
        let fee_payment;
        if (fee_payments && fee_payments.dataValues.status === StoreFeePaymentStatus.PENDING) {
            fee_payment = fee_payments;
        } else {
            fee_payment = await StoreFeePayment.create({
                storeId,
                id: idGenerator(),
                amount: orders.dataValues.taxes_amount
            });
        }
        let paymentMethods = ["all"];

        let transaction = {
            type: "sale",
            class: "ecom"
        };

        let transaction_details = [
            transaction.type,
            transaction.class
        ];
        const cart = {
            id: fee_payment.dataValues.id,
            currency: "SAR",
            amount: fee_payment.dataValues.amount,
            description: "sahm monthly fee payment"
        };

        const cart_details = [
            cart.id,
            cart.currency,
            cart.amount,
            cart.description
        ];

        let customer_details = [
            store.owner_full_name,
            store.email,
            store.phone_number,
            "",
            "",
            "SA",
            "SA",
            "",
            "192.168.1.1"
        ];

        let shipping_address = customer_details;
        let response_URLs = [
            "https://api.sahm-sau.com/" + `stores/${storeId}/fee-payments/${fee_payment.dataValues.id}`,
            "https://api.sahm-sau.com/" + `stores/${storeId}/fee-payments/${fee_payment.dataValues.id}/facture`,
        ];

        let lang = "ar";

        const paymentPageCreated = (url, data) => {
            res.json({data: {payment_url: url?.redirect_url, fee_payment}});
        }

        let frameMode = false;

        payTabs.createPaymentPage(
            paymentMethods,
            transaction_details,
            cart_details,
            customer_details,
            shipping_address,
            response_URLs,
            lang,
            paymentPageCreated,
            frameMode
        );
        return;
    }
    throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
}