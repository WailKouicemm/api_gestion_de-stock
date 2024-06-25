const Product = require("../../models/product/Product");
const Store = require("../../models/store/Store");
const {Op} = require("sequelize");
const StoreFeePayment = require("../../models/store/StoreFeePayment");
const Client = require("../../models/client/Client");
const {compareSync, genSaltSync, hashSync} = require("bcrypt");
const generateJWT = require("../../functions/generateJWT");
const {v1: idGenerator} = require("uuid");
const UserTypes = require("../../models/common/SystemUserTypes");
const CustomError = require("../../models/error/CustomError");
const City = require("../../models/common/City");
const Order = require("../../models/order/Order");
const OrderItem = require("../../models/order/OrderItem");
const ProductPriceDeduction = require("../../models/product/ProductPriceDeduction");
const OrderStatus = require("../../models/order/OrderStatus");
const sequelize = require("sequelize");
const StoreNotification = require("../../models/store/StoreNotification");
const ErrorMessage = require("../../models/error/ErrorMessage");
const OTPValidation = require("../../models/common/OTPValidation");
const SpecialOfferInfo = require("../../models/product/SpecialOfferInfo");
const StoreBanner = require("../../models/store/StoreBanner");
const DeviceToken = require("../../models/common/UserDeviceToken");
const CartItem = require("../../models/client/CartItem");
const ClientFavouriteProduct = require("../../models/client/ClientFavouriteProduct");
const UsersType = require("../../models/common/SystemUserTypes");
const StoreStatus = require("../../models/store/StoreStatus");
const Image = require("../../models/common/Image");
const SystemUsersTypes = require("../../models/common/SystemUserTypes");
const axios = require("axios");

module.exports.updateStore = async (req, res) => {
    const {storeId} = req.params;
    const {
        owner_full_name,
        delivery_administration_phone_number,
        delivery_support_phone_number,
        min_order_price,
        password,
        status,
        brand,
        city,
        name
    } = req.body;
    const store = await Store.findByPk(storeId);
    if (req.user.type === SystemUsersTypes.ADMIN) {
        let cityExists;
        if (city) {
            cityExists = await City.findOne({
                where: {
                    [Op.or]: [{name: city},
                        {name_ar: city}]
                }
            });
            if (!cityExists) {
                throw new CustomError(404, new ErrorMessage("city not found", "المدينة غير موجودة"));
            }
        }

        store.set(
            {
                ...(status && {status}),
                ...(brand && {brand: brand === "true"}),
                ...(city && {cityName: cityExists.name})
            }
        )
    }

    

    let hashedPassword;
    if (password) {
        const salt = genSaltSync(10);
        hashedPassword = hashSync(password, salt);
        store.password = hashedPassword;
    }
    store.set({
        ...(owner_full_name && {owner_full_name}),
        ...(delivery_administration_phone_number && {delivery_administration_phone_number}),
        ...(delivery_support_phone_number && {delivery_support_phone_number}),
        ...(min_order_price && {min_order_price}),
        ...(name && {name}),
    });
    const updatedStore = await store.save();
    delete updatedStore.password;
    res.json({data: store.id});


}

module.exports.login = async (req, res) => {
    const {login, password, code, otp_validation_id, device_token} = req.body;
    const {forgot_password} = req.query;
    const store = await Store.findOne({
        where: {[Op.or]: [{email: login}, {phone_number: login}]},
        attributes: ["id", "phone_number", "password", "delivery_support_phone_number", "delivery_administration_phone_number", "name", "status", "min_order_price", "cityName"]
    });
    if (forgot_password) {
        if (code && otp_validation_id) {
            const validationCode = await OTPValidation.findOne({
                where: {
                    id: otp_validation_id,
                    expiresAt: {[Op.gt]: new Date()}, code
                }
            });
            if (!validationCode) {
                throw new CustomError(404, new ErrorMessage("invalid verification code", "رمز التحقق غير صالح"));
            }
            if (store && password) {
                const salt = genSaltSync(10);
                const hashedPassword = hashSync(password, salt);
                store.password = hashedPassword;
                await store.save();
                delete store.password;
                await validationCode.destroy();
                if (device_token) {
                    const deviceToken = await DeviceToken.findOne({where: {token: device_token, storeId: store.id}});
                    if (!deviceToken) {
                        await DeviceToken.create({token: device_token, storeId: store.id});
                    }
                }
                return res.status(200).json({
                    data: {
                        token: generateJWT(store.id, UserTypes.STORE),
                        store_id: store.id,
                    }
                });
            } else {
                throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
            }
        } else {
            const otp_validation_id = idGenerator();
            if (store) {
                const old = (await OTPValidation.findOne({where: {phone_number: store.phone_number}}));
                if (old) {
                    await old.destroy();
                }
                const code = Math.floor(100000 + Math.random() * 899999);
                await OTPValidation.create({
                    expiresAt: new Date(new Date().setMinutes(new Date().getMinutes() + 2)),
                    id: otp_validation_id,
                    phone_number: store.phone_number,
                    code
                });
                axios.post(`https://api.taqnyat.sa/v1/messages?bearerTokens=d5f7fd4e87a48f490ff5cfd2cb55553e&sender=sahm&recipients=966${store.phone_number.toString().trim().replace("0", "")}&body=رمز التحقق الخاص بك هو : ${code}`).then(res => {
                }).catch(err => {
                    console.error(err);
                });
            }
            res.json({
                data: {
                    otp_validation_id,
                }
            })


        }
    } else {
        if (store && compareSync(password, store.password)) {
            delete store.dataValues.password;
            if (device_token) {
                const deviceToken = await DeviceToken.findOne({where: {token: device_token}});
                if (!deviceToken) {
                    await DeviceToken.create({token: device_token, storeId: store.id});
                } else {
                    if (deviceToken.dataValues.storeId !== store.dataValues.id) {
                        deviceToken.storeId = store.id;
                        await deviceToken.save();
                    }
                }
            }
            return res.status(200).json({
                data: {
                    token: generateJWT(store.id, UserTypes.STORE),
                    store_id: store.id,
                }
            });
        }
        throw new CustomError(404, new ErrorMessage("Wrong login or password", "خطأ في تسجيل الدخول أو كلمة المرور"));
    }

}


module.exports.createStore = async (req, res) => {
    const {
        owner_full_name,
        register_number,
        tax_number,
        city,
        delivery_support_phone_number,
        delivery_administration_phone_number,
        phone_number,
        password,
        name,
        email,
        min_order_price,
        code,
        otp_validation_id,
        device_token,
    } = req.body;
    const cityExists = await City.findOne({
        where: {
            [Op.or]: [{name: city},
                {name_ar: city}]
        }
    });
    if (!cityExists) {
        throw new CustomError(404, new ErrorMessage("city not found", "المدينة غير موجودة"));
    }
    if (otp_validation_id) {
        if (!req.files.store_image || !req.files.register_image) {
            throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
        }
    }
    const storeExists = await Store.findOne({
        attributes: {exclude: ['password']}, where: {
            [Op.or]: [(email&&{email}), {phone_number}, {register_number}, {tax_number}]
        }
    });
    if (storeExists) {
        if (storeExists.phone_number === phone_number) {
            throw new CustomError(409, new ErrorMessage("phone number already in use", "رقم الهاتف مستخدم بالفعل"));
        }
        if (storeExists.email === email) {
            throw new CustomError(409, new ErrorMessage("email already in use", "البريد الإلكتروني مستخدم بالفعل"));
        }
        if (storeExists.register_number === register_number) {
            throw new CustomError(409, new ErrorMessage("register number already in use", "رقم التسجيل مستخدم بالفعل"));
        }
        if (storeExists.tax_number === tax_number) {
            throw new CustomError(409, new ErrorMessage("tax number already in use", "رقم الضريبة مستخدم بالفعل"));
        }
    }

    if (code && otp_validation_id) {
        const validationCode = await OTPValidation.findOne({
            where: {
                id: otp_validation_id,
                expiresAt: {[Op.gt]: new Date()}, code
            }
        });
        if (!validationCode) {
            throw new CustomError(404, new ErrorMessage("invalid verification code", "رمز التحقق غير صالح"));
        }
        const salt = genSaltSync(10);
        const hashedPassword = hashSync(password, salt);
        const store = await Store.create({
            register_number,
            tax_number,
            owner_full_name,
            email,
            store_image: (await Image.create({
                id: idGenerator(),
                url: process.env.SERVER_URL + req.files.store_image[0].filename
            })).id,
            ...(req.files.tax_image && {
                tax_image: (await Image.create({
                    id: idGenerator(),
                    url: process.env.SERVER_URL + req.files.tax_image[0].filename
                })).id
            }),
            register_image: (await Image.create({
                id: idGenerator(),
                url: process.env.SERVER_URL + req.files.register_image[0].filename
            })).id,
            delivery_support_phone_number,
            delivery_administration_phone_number,
            cityName: cityExists.name,
            phone_number,
            password: hashedPassword,
            name,
            min_order_price,
        });
        if (device_token) {
            const deviceToken = await DeviceToken.findOne({where: {token: device_token}});
            if (!deviceToken) {
                await DeviceToken.create({token: device_token, storeId: store.id});
            } else {
                if (deviceToken.dataValues.storeId !== store.dataValues.id) {
                    deviceToken.storeId = store.id;
                    await deviceToken.save();
                }
            }
        }
        const token = generateJWT(store.id, UserTypes.STORE);
        res.status(201).json({data: {token, store_id: store.id}});
        await validationCode.destroy();
    } else {
        const old = (await OTPValidation.findOne({where: {phone_number}}));
        if (old) {
            await old.destroy();
        }
        const code = Math.floor(100000 + Math.random() * 899999);
        const otp_validation = await OTPValidation.create({
            expiresAt: new Date(new Date().setMinutes(new Date().getMinutes() + 2)),
            id: idGenerator(),
            phone_number,
            code: code
        });
        res.json({
            data: {
                otp_validation_id: otp_validation.id,
            }
        });
        axios.post(`https://api.taqnyat.sa/v1/messages?bearerTokens=${process.env.OTP_API_TOKEN}&sender=${process.env.OTP_SENDER}&recipients=966${phone_number.toString().trim().replace("0", "")}&body=كود التفعيل الخاص بتطبيق سهم : ${code}`).then(res => {
        }).catch(err => {
            console.error(err);
        });
    }


}


module.exports.getStore = async (req, res) => {
    const {storeId} = req.params;
    const {page_size = 12, brand} = req.query;
    if (req.user.type === SystemUsersTypes.CLIENT) {
        const store = await Store.findByPk(storeId, {
            attributes: {exclude: ["password", "createdAt", "updatedAt", "owner_full_name", "delivery_administration_phone_number", "delivery_support_phone_number", "tax_number", "register_number", "phone_number", "email"]},
        });
        if (!store) {
            throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
        }
                store.dataValues.store_image = await Image.findOne({where: {id: store.store_image}});
        if (store.status !== StoreStatus.ACTIVE) {
            throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
        }
        store.dataValues.banners = await StoreBanner.findAll({
            where: {storeId},
            include: {model: Image, attributes: ["url"]},
            order: [["createdAt", "DESC"]]
        });
        store.dataValues.products = await Product.findAll({
            where: {storeId, deleted: false},
            attributes: ["id", "price", "unit_price", "name_ar", "name_en", "options", "special_offer"],
            limit: Number(page_size),
            order: [["createdAt", "DESC"]],
            offset: 0,
            include: [{
                model: SpecialOfferInfo,
                required: false,
                attributes: [req.language === "ar-SA" ? ["message_ar", "message"] : ["message_en", "message"]],
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
        store.dataValues.nb_products = await Product.count({where: {storeId: store.id, deleted: false}});
        const productsIds = store.dataValues.products.map(product => product.id);
        const ordersIds = (await Order.findAll({
            where: {storeId, status: OrderStatus.COMPLETED},
            attributes: ["id"]
        })).map(order => order.id);
        const orderItems = (await OrderItem.findAll({
            where: {orderId: ordersIds, productId: productsIds},
            group: "productId",
            attributes: ["productId", [sequelize.fn('sum', sequelize.col('quantity')), 'sold_nb']]
        }));
        for (const product of store.dataValues.products) {
            for (const orderItem of orderItems) {
                if (product.dataValues.id === orderItem.dataValues.productId) {
                    product.dataValues.sold_nb = orderItem.dataValues.sold_nb;
                    break;
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
            for (const product of store.dataValues.products) {
                for (const cartItem of cartItems) {
                    if (product.dataValues.id === cartItem.dataValues.productId) {
                        product.dataValues.in_cart = true;
                        break;
                    }
                }
                for (const favouriteItem of favouriteItems) {
                    if (product.dataValues.id === favouriteItem.dataValues.productId) {
                        product.dataValues.in_favourites = true;
                        break;
                    }
                }
            }
        }
        res.json({data: {store: store.dataValues}});
    }
    if (req.user.type === SystemUsersTypes.ADMIN) {
        const store = await Store.findOne({
            where: {[Op.or]: [{id: storeId}, {phone_number: storeId}], brand: brand === "true"},
            attributes: {exclude: ["password", "createdAt", "updatedAt"]},
        });
        if (!store) {
            throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
        }
        store.dataValues.nb_products = await Product.count({where: {storeId: store.id, deleted: false}});
        store.dataValues.orders_count = await Order.count({where: {storeId: store.id}});
        store.dataValues.store_image = await Image.findOne({where: {id: store.store_image}});
        store.dataValues.register_image = await Image.findOne({where: {id: store.register_image}});

        let total_earnings = 0;
        for (const order of (await Order.findAll({
            where: {
                storeId: store.id,
                status: {[Op.notIn]: [OrderStatus.CANCELED]}
            }, attributes: ["amount"]
        }))) {
            total_earnings += Number(order.amount);
        }
        store.dataValues.total_earnings = total_earnings;
        res.json({data: {store: store.dataValues}});
    }
}


module.exports.getStores = async (req, res) => {
    const {page_size = 12, page = 0, brand = "false", status, city} = req.query;
    let attributes;
    let where;
    if (req.user.type === UsersType.CLIENT) {
        attributes = ["id", "cityName", "name", "store_image"];
        where = {cityName: req.user.cityName, status: StoreStatus.ACTIVE, brand: brand === "true"};
    } else {
        attributes = {exclude: ["password","register_image"]}
        where = {
            ...(city && {cityName: city}),
            ...(status && {status} || {status: {[Op.notIn]: [StoreStatus.PENDING]}}),
            brand: brand === "true"
        }
    }


    const stores = await Store.findAll({
        where,
        limit: Number(page_size),
        offset: Number(page) * Number(page_size),
        order: [["createdAt", "DESC"]],
        attributes: attributes,
    });

        for (const store of stores) {
            store.dataValues.store_image = await Image.findOne({where: {id: store.store_image}});
            if (status !== StoreStatus.PENDING) {
            store.dataValues.nb_products = await Product.count({where: {storeId: store.id, deleted: false}});

            if (req.user.type === SystemUsersTypes.ADMIN) {
                store.dataValues.orders_count = await Order.count({where: {storeId: store.id}});
                let total_earnings = 0;
                for (const order of (await Order.findAll({
                    where: {
                        storeId: store.id,
                        status: {[Op.notIn]: [OrderStatus.CANCELED]}
                    }, attributes: ["amount"]
                }))) {
                    total_earnings += Number(order.amount);
                }
                store.dataValues.total_earnings = total_earnings;
            }
        }
    }

    return res.json({data: stores});
}







