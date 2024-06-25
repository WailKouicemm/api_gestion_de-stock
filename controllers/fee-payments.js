const {Op} = require("sequelize");
const StoreFeePayment = require("../models/store/StoreFeePayment");
const StoreFeePaymentStatus = require("../models/store/StoreFeePaymentStatus");
module.exports.getFeePayments = async (req, res) => {
    const {page_size = 12, page = 0, status,min_date,max_date} = req.query;
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
    const fee_payments = await StoreFeePayment.findAll({
        where: {
            status :StoreFeePaymentStatus.APPROVED,
            ...((min_date||max_date)&&{updatedAt:{
                    [Op.between]:[minDate?minDate:0,maxDate?maxDate:Date.now()]
                }}),
        },
        limit: Number(page_size),
        offset: Number(page)*Number(page_size),
        order: [["updatedAt", "DESC"]],
    });

    res.json({data:fee_payments});
}