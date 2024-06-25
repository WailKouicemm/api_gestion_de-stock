const express = require('express');
const {body} = require("express-validator");
const upload = require("../config/multer");

const storesController = require("../controllers/stores/index");
const productsController = require("../controllers/products");
const ordersController = require("../controllers/orders");
const validateUser = require("../middlewares/validateUser");
const authenticate = require("../middlewares/authenticate");
const requestValidation = require("../middlewares/requestValidation");
const adminCheck = require("../middlewares/adminCheck");
const router = express.Router();
router.post("/:storeId/ads", authenticate, adminCheck, upload.single("ad_image"), storesController.createAd);
router.get("/:storeId/stats", authenticate, validateUser, storesController.getStats);

router.patch("/:storeId/products/:productId", upload.fields([{name: "image", maxCount: 1}, {
    name: 'offer_image',
    maxCount: 1
}]), authenticate, validateUser, productsController.updateProduct);
router.delete("/:storeId/products/:productId", authenticate, validateUser, productsController.deleteProduct);
router.get("/:storeId/products", authenticate, productsController.getProducts);
router.post("/:storeId/products", authenticate, validateUser, upload.fields([{
        name: 'product_image',
        maxCount: 1
    }, {name: 'offer_image', maxCount: 1}, {name: 'excel_file', maxCount: 1}]),
    productsController.createProduct);
router.get("/:storeId/orders/:orderId", authenticate, validateUser, ordersController.getOrder);
router.patch("/:storeId/orders/:orderId", authenticate, validateUser, [body("status").notEmpty()], requestValidation, ordersController.updateOrderStatus);
router.get("/:storeId/orders", authenticate, validateUser, ordersController.getOrders);
router.delete("/:storeId/banners/:bannerId", authenticate, validateUser, storesController.deleteBanner);
router.get("/:storeId/banners", authenticate, validateUser, storesController.getBanners);
router.post("/:storeId/banners", upload.single("image"), authenticate, validateUser, storesController.addBanner);
router.use("/:storeId/fee-payments/:feePaymentId/facture", storesController.monthlyPaymentFacture);
router.post("/:storeId/fee-payments/:feePaymentId", storesController.updateFeePayment);
router.get("/:storeId/fee-payments", authenticate, validateUser, storesController.getMonthlyPayments);
router.post("/:storeId/fee-payments", authenticate, validateUser, storesController.createMonthlyPayment);
router.get("/:storeId", authenticate, storesController.getStore);
router.patch("/:storeId", authenticate, validateUser, storesController.updateStore);
router.post("/login", [body("login").notEmpty()], storesController.login);
router.post("/", upload.fields([{name: 'store_image', maxCount: 1}, {
    name: 'register_image',
    maxCount: 1
}]), [body("name").notEmpty(), body("password").notEmpty(), body("phone_number").notEmpty(), body("delivery_administration_phone_number").notEmpty(), body("delivery_support_phone_number").notEmpty(), body("city").notEmpty(), body("register_number").notEmpty()], storesController.createStore);
router.get("/", authenticate, storesController.getStores);

module.exports = router;
