const express = require('express');
const {body} = require("express-validator");

const clientsController = require("../controllers/clients/index");
const storesController = require("../controllers/stores/stores");
const ordersController = require("../controllers/orders");

const requestValidation = require("../middlewares/requestValidation");
const authenticate = require("../middlewares/authenticate");
const adminCheck = require("../middlewares/adminCheck");
const validateUser = require("../middlewares/validateUser");
const router = express.Router();

router.post("/", [ body("name").notEmpty(), body("password").notEmpty(), body("phone_number").notEmpty(), body("city").notEmpty(), body("register_number").notEmpty()], requestValidation, clientsController.createClient);
router.post("/login", [body("login").notEmpty()], requestValidation, clientsController.login);

router.use(authenticate);
router.get("/:clientId/stores/:storeId", storesController.getStore);
router.use("/:clientId",validateUser)
router.delete("/:clientId/cart/:productId", clientsController.removeFromCart);
router.post("/:clientId/cart",[body("productId").notEmpty().isLength({min:36,max:36})],requestValidation, authenticate,validateUser,clientsController.addToCart);
router.get("/:clientId/cart", clientsController.getCart);
router.get("/:clientId/orders/:orderId", ordersController.getOrder);
router.patch("/:clientId/orders/:orderId", ordersController.updateOrderStatus);
router.get("/:clientId/orders", ordersController.getOrders);
router.post("/:clientId/orders", ordersController.createOrder);
router.delete("/:clientId/favourites/:productId", clientsController.removeFromFavourites);
router.get("/:clientId/favourites", clientsController.getFavourites);
router.post("/:clientId/favourites", [body("productId").notEmpty().isLength({min:36,max:36})],requestValidation,authenticate,validateUser,clientsController.addToFavourites);
router.get("/:clientId", clientsController.getClient);

router.use(adminCheck)
router.get("/",clientsController.getClients);
router.patch("/:clientId",clientsController.updateClient);

module.exports = router;
