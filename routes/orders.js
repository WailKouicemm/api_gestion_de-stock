const express = require('express');
const {body} = require("express-validator");
const ordersController = require("../controllers/orders");
const validateRequest = require("../middlewares/requestValidation");
const router = express.Router();

router.get("/",ordersController.getOrders);
router.get("/order-fee",ordersController.getOrderFee);
router.get("/:orderId",ordersController.getOrder);
router.delete("/:orderId",ordersController.deleteOrder);
router.put("/order-fee",[body("amount").notEmpty().isInt({min:0})],validateRequest,ordersController.updateOrderFee);



module.exports = router;
