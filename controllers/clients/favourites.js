const Image = require("../../models/common/Image");
const Store = require("../../models/store/Store");
const Product = require("../../models/product/Product");
const ClientFavouriteProduct = require("../../models/client/ClientFavouriteProduct");
const CustomError = require("../../models/error/CustomError");
const ErrorMessage = require("../../models/error/ErrorMessage");
module.exports.getFavourites = async (req, res) => {
    const {clientId} = req.params;
    const products = (await req.user.getProducts({attributes:{exclude:["createdAt","updatedAt","deleted"]}}));
    const imagesIds = (products).map((product) => product.imageId);
    const images = (await Image.findAll({where: {id: imagesIds}, attributes: ["url"]}));
    for (let i=0;i<products.length;i++) {
        const product = products[i];
        delete product.dataValues.client_favourite_product;
        delete product.dataValues.imageId;
        product.dataValues.image = images[i];
        const store = await Store.findOne({where: {id: product.dataValues.storeId}});
        product.dataValues.storeId = store.id;
        product.dataValues.store_name = store.name;
    }
    res.json({data: products});
}
module.exports.addToFavourites = async (req, res) => {
    const {clientId} = req.params;
    const {productId} = req.body;
    const product = await Product.findOne({where: {id: productId, deleted: false}});
    const favouriteItem = await ClientFavouriteProduct.findOne({where: {productId, clientId}});
    if (!favouriteItem) {
        if (!product) {
            throw new CustomError(404, new ErrorMessage("product not found", "المنتج غير موجود"));
        }
        await ClientFavouriteProduct.create({productId, clientId});
    }
    res.json({data: productId});
}
module.exports.removeFromFavourites = async (req, res) => {
    const {clientId, productId} = req.params;
    const product = await Product.findByPk(productId);
    const favouriteItem = await ClientFavouriteProduct.findOne({where: {productId, clientId}});
    if (!favouriteItem || !product) {
        throw new CustomError(404, new ErrorMessage("product not found", "المنتج غير موجود"));
    }
    await favouriteItem.destroy();
    res.json({data: productId});
}