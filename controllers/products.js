const {v1: idGenerator} = require("uuid");
const xlsx = require('node-xlsx').default;

const Product = require("../models/product/Product");
const Image = require("../models/common/Image");
const Store = require("../models/store/Store");
const {Op} = require("sequelize");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
const SpecialOfferInfo = require("../models/product/SpecialOfferInfo");
const OrderItem = require("../models/order/OrderItem");
const CartItem = require("../models/client/CartItem");
const ClientFavouriteProduct = require("../models/client/ClientFavouriteProduct");
const Order = require("../models/order/Order");
const OrderStatus = require("../models/order/OrderStatus");
const UserTypes = require("../models/common/SystemUserTypes");
const sequelize = require("sequelize");

const fs = require("fs");

module.exports.createProduct = async (req, res) => {
    const {storeId} = req.params;

    if (req.files?.excel_file) {
        const workSheetsFromFile = xlsx.parse(req.files.excel_file[0].path);
        const list = workSheetsFromFile[0].data
        const myList = [];
        for (const item of list) {
            if (item.indexOf("اسم الصنف عربي") !== -1) {
                continue;
            }
            const product = {name_ar: item[0], name_en: item[1], options: item[2], unit_price: item[4], price: item[6]};
            if (!(product.name_ar && product.options && product.unit_price && product.price)) {
                continue;
            }
            myList.push({...product, storeId: storeId, id: idGenerator(), special_offer: false});

        }
        await Product.bulkCreate(myList);
        fs.rmSync(req.files.excel_file[0].path);
        res.json({message: "Done"});
    } else {
        const {
            name_ar,
            name_en,
            options,
            unit_price,
            price,
            special_offer,
            special_offer_message_ar,
            special_offer_message_en,
        } = req.body;
        let {image_id} = req.body;
        if (!(req.files?.product_image || image_id)) {
            throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }

        if (!(name_ar && name_en && options && unit_price && price)) {
            throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }
        /*if (special_offer === "true" && !req.files.offer_image) {

            throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }*/
        const store = Store.findByPk(storeId);
        if (!store) {
            throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
        }
        const productExist = await Product.findOne({
            where: {
                [Op.or]: [{name_ar}, {name_en}], storeId, deleted: false
            }
        });
        if (productExist) {
            throw new CustomError(409, new ErrorMessage("product already exists", "المنتج موجود بالفعل"));
        }
        if (special_offer === "true") {
            if (!(special_offer_message_ar && special_offer_message_en)) {
                throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
            }
        }
        if (image_id) {
            image_id = (await Image.findOne({where: {id: image_id, type: "PUBLIC"}})) ? image_id : null
            if (!image_id){
                throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
            }
        } else {
            const image = await Image.create({
                id: idGenerator(),
                url: process.env.SERVER_URL + req.files.product_image[0].filename
            });
            image_id = image.id;
        }

        const product = await Product.create({
            imageId: image_id,
            storeId: storeId,
            id: idGenerator(),
            name_ar,
            name_en,
            options,
            unit_price,
            price,
            special_offer: special_offer === "true",
        });
        let special_offer_image;
        if (product.special_offer) {
            if (req.files.offer_image) {
                special_offer_image = await Image.create({
                    id: idGenerator(),
                    url: process.env.SERVER_URL + req.files.offer_image[0].filename
                });
            }
            product.dataValues.special_offer_info = await SpecialOfferInfo.create({
                ...(special_offer_image&&{imageId: special_offer_image.id}),
                message_en: special_offer_message_en,
                message_ar: special_offer_message_ar,
                productId: product.id
            });
            product.dataValues.special_offer_info.image = special_offer_image;
            product.dataValues.special_offer_info.message = req.language === "ar-SA" ? product.dataValues.special_offer_info.message_ar : product.dataValues.special_offer_info.message_en
        }
        const image = await Image.findByPk(image_id);
        res.json({data: {product_id: product.id, product_image: image.dataValues.url, special_offer_image}});
    }
}

module.exports.updateProduct = async (req, res) => {
    const {storeId, productId} = req.params;
    const {
        name_ar, name_en, options, price, unit_price, special_offer,
        special_offer_message_ar,
        special_offer_message_en,
    } = req.body;
    let {image_id} = req.body;
    const product = await Product.findOne({where: {storeId, id: productId, deleted: false}});
    if (!product) {
        throw new CustomError(404, new ErrorMessage("product not found", "المنتج غير موجود"));
    }
    if (special_offer === "true") {
        if (!(special_offer_message_ar && special_offer_message_en)) {
            throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }
    }
    const orderItem = await OrderItem.findOne({where: {productId}});
    let image;
    if (req.files.image) {
        image = await Image.create({id: idGenerator(), url: process.env.SERVER_URL + req.files.image[0].filename});
    }
    if (image_id) {
        image_id = (await Image.findOne({where: {id: image_id, type: "PUBLIC"}})) ? image_id : null
    }
    const productNewBody = {
        ...(name_ar && {name_ar}),
        ...(name_en && {name_en}),
        ...(options && {options}),
        ...(price && {price: Number(price)}),
        ...(unit_price && {unit_price: Number(unit_price)}),
        ...(image_id && {imageId: image_id}),
        ...(image && {imageId: image.id}),
        ...(special_offer==="true" && {special_offer: special_offer === "true"})
    };
    if (special_offer==="false"){
        await SpecialOfferInfo.destroy({where:{productId:productId}});
        product.special_offer = false;
        await product.save();
    }
    if (orderItem) {
        const newProductId = idGenerator();
        const newProduct = await Product.create({
            ...product.dataValues,
            ...productNewBody,
            id: newProductId,
        });
        product.deleted = true;
        await product.save();
        await ClientFavouriteProduct.update({productId: newProductId}, {where: {productId}, fields: ["productId"]});
        await CartItem.update({productId: newProductId}, {where: {productId}, fields: ["productId"]});
        if (special_offer === "true") {
            let special_offer_image;
            if (req.files.offer_image) {
                special_offer_image = await Image.create({
                    id: idGenerator(),
                    url: process.env.SERVER_URL + req.files.offer_image[0].filename
                });
            }
            newProduct.dataValues.special_offer_info = await SpecialOfferInfo.create({
                ...(special_offer_image&&{imageId: special_offer_image.id}),
                message_en: special_offer_message_en,
                message_ar: special_offer_message_ar,
                productId: newProduct.id
            });
            product.dataValues.special_offer_info.dataValues.image = special_offer_image;
            newProduct.dataValues.special_offer_info.message = req.language === "ar-SA" ? newProduct.dataValues.special_offer_info.message_ar : newProduct.dataValues.special_offer_info.message_en
        }else{
            const special_offer_info = await SpecialOfferInfo.findOne({where:{productId},include:{
                    model:Image,
                    required:false,
                    attributes:["url"],
                }});
            if (special_offer_info){
                newProduct.dataValues.special_offer_info = special_offer_info;
                newProduct.dataValues.special_offer_info.message = req.language === "ar-SA" ? product.dataValues.special_offer_info.message_ar : newProduct.dataValues.special_offer_info.message_en
            }

        }
        if (newProduct.dataValues.imageId){
            newProduct.dataValues.image = await Image.findByPk(newProduct.dataValues.imageId,{attributes:["url"]});
        }
        res.json({data: {product: newProduct}});
    } else {
        product.set({
            ...productNewBody
        });
        const updatedProduct = await product.save();
        if (special_offer === "true") {
            let special_offer_image;
            if (req.files.offer_image) {
                special_offer_image = await Image.create({
                    id: idGenerator(),
                    url: process.env.SERVER_URL + req.files.offer_image[0].filename
                });
            }
            await SpecialOfferInfo.destroy({where:{productId:updatedProduct.id}});
            updatedProduct.dataValues.special_offer_info = await SpecialOfferInfo.create({
                ...(special_offer_image&&{imageId: special_offer_image.id}),
                message_en: special_offer_message_en,
                message_ar: special_offer_message_ar,
                productId: updatedProduct.id
            });
            product.dataValues.special_offer_info.dataValues.image = special_offer_image;
            product.dataValues.special_offer_info.dataValues.message = req.language === "ar-SA" ? product.dataValues.special_offer_info.message_ar : product.dataValues.special_offer_info.message_en
        }else{
            const special_offer_info = await SpecialOfferInfo.findOne({where:{productId},include:{
                model:Image,
                    required:false,
                    attributes:["url"],
                }});
            if (special_offer_info){
                updatedProduct.dataValues.special_offer_info = special_offer_info;
                updatedProduct.dataValues.special_offer_info.message = req.language === "ar-SA" ? updatedProduct.dataValues.special_offer_info.message_ar : updatedProduct.dataValues.special_offer_info.message_en
            }
        }
        if (updatedProduct.dataValues.imageId){
            updatedProduct.dataValues.image = await Image.findByPk(updatedProduct.dataValues.imageId,{attributes:["url"]});
        }
        res.json({data: {product: updatedProduct}});
    }
}
module.exports.getProducts = async (req, res) => {
    const {page_size = 12, page = 0, q = ""} = req.query;
    const {storeId} = req.params;
    const products = await Product.findAll({
        where: {
            storeId, deleted: false,
            [Op.or]: [{name_ar: {[Op.like]: `%${q}%`}},
                {name_en: {[Op.like]: `%${q}%`}}]
        },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "price", "unit_price", "name_ar", "name_en", "options", "special_offer"],
        limit: Number(page_size),
        offset: Number(page_size) * Number(page),
        include: [{
            model: SpecialOfferInfo,
            required: false,
            attributes: [req.language === "ar-SA" ? ["message_ar", "message"] : ["message_en", "message"],"message_ar","message_en"],
            include: {
                model: Image,
                attributes: ["url"],
                required: false,
            }
        }, {
            model: Image,
            attributes: ["url"],
            required: false,
        }]
    });


    const productsIds = products.map(product => product.id);
    const ordersIds = (await Order.findAll({
        where: {storeId, status: OrderStatus.COMPLETED},
        attributes: ["id"]
    })).map(order => order.id);
    const orderItems = (await OrderItem.findAll({
        where: {orderId: ordersIds, productId: productsIds},
        group: "productId",
        attributes: ["productId", [sequelize.fn('sum', sequelize.col('quantity')), 'sold_nb']]
    }));
    for (const product of products) {
        for (const orderItem of orderItems) {
            if (product.dataValues.id === orderItem.dataValues.productId) {
                product.dataValues.sold_nb = orderItem.dataValues.sold_nb;
            }
        }
    }
    if (req.user.type === UserTypes.CLIENT) {
        const cart = await req.user.getCart();
        const cartItems = await CartItem.findAll({
            attributes: ["productId"],
            where: {cartId: cart.id, productId: productsIds}
        });
        const favouriteItems = await ClientFavouriteProduct.findAll({
            attributes: ["productId"],
            where: {productId: productsIds, clientId: req.user.id}
        });
        for (const product of products) {
            for (const cartItem of cartItems) {
                if (product.dataValues.id === cartItem.dataValues.productId) {
                    product.dataValues.in_cart = true;
                }
            }
            for (const favouriteItem of favouriteItems) {
                if (product.dataValues.id === favouriteItem.dataValues.productId) {
                    product.dataValues.in_favourites = true;
                }
            }
        }
    }
    res.json({data: products});
}




module.exports.deleteProduct = async (req, res) => {
    const {storeId, productId} = req.params;
    const product = await Product.findOne({where: {storeId, id: productId, deleted: false}});
    if (!product) {
        throw new CustomError(404, new ErrorMessage("product not found", "المنتج غير موجود"));
    }
    product.deleted = true;
    const newProduct = await product.save();
    res.json({data: {product: newProduct}});
}