const CartItem = require("../../models/client/CartItem");
const Product = require("../../models/product/Product");
const Store = require("../../models/store/Store");
const Image = require("../../models/common/Image");
const CustomError = require("../../models/error/CustomError");
const ErrorMessage = require("../../models/error/ErrorMessage");
module.exports.getCart = async (req, res) => {
    const {clientId} = req.params;
    const cart = await req.user.getCart();
    const productIds = (await CartItem.findAll({
        where: {cartId: cart.id},
        attributes: ["productId"]
    })).map((value, index) => value.dataValues.productId);
    const storeIds = (await Product.findAll({
        where: {id: productIds},
        attributes: ["storeId"],
        group: "storeId"
    })).map((value, index) => value.dataValues.storeId);
    const products = {}
    for (const storeId of storeIds) {
        const storeProducts = await Product.findAll({where: {storeId, id: productIds}});
        const cartItems = (await CartItem.findAll({where: {productId: productIds, cartId: cart.id}}));
        for (const cartItem of cartItems) {
            for (const product of storeProducts) {
                if (product.id === cartItem.dataValues.productId) {
                    product.dataValues.quantity = cartItem.dataValues.quantity;
                    product.dataValues.image = await Image.findOne({where:{id:product.dataValues.imageId}});
                    break;
                }
            }
        }
        const store = await Store.findByPk(storeId, {attributes: ["name", "min_order_price"]});
        products[storeId] = {store, products: storeProducts};
    }
    res.json({data: products});
}
module.exports.addToCart = async (req, res) => {
    const {clientId} = req.params;
    const {productId,quantity=1} = req.body;
    if (quantity<=0){
        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
    const cart = await req.user.getCart();
    const product = await Product.findOne({where: {id: productId, deleted: false}});
    if (!product) {
        throw new CustomError(404, new ErrorMessage("product not found", "المنتج غير موجود"));
    }
    const cartItem = await CartItem.findOne({where: {cartId: cart.id, productId}});
    if (cartItem) {
        cartItem.quantity += quantity;
        await cartItem.save();
    } else {
        await CartItem.create({cartId: cart.id, productId, quantity: quantity});
    }
    res.json({data: productId});
}
module.exports.removeFromCart = async (req, res) => {
    const {clientId, productId} = req.params;
    const {delete: deleteProduct} = req.query;
    const cart = await req.user.getCart();
    const cartItem = await CartItem.findOne({where: {cartId: cart.id, productId}});
    if (!cartItem) {
        throw new CustomError(404, new ErrorMessage("product not found", "المنتج غير موجود"));
    }
    if (deleteProduct === "true") {
        await cartItem.destroy();
    } else {
        cartItem.quantity -= 1;
        if (cartItem.quantity !== 0) {
            await cartItem.save();

        } else {
            await cartItem.destroy();
        }
    }
    res.json({data: productId});
}
