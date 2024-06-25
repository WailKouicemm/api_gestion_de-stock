require("express-async-errors");
const Client = require("../../models/client/Client");
const {compareSync, hashSync, genSaltSync} = require("bcrypt");
const UserTypes = require("../../models/common/SystemUserTypes");
const generateJWT = require("../../functions/generateJWT");
const {v1: idGenerator} = require("uuid");
const CustomError = require("../../models/error/CustomError");
const Store = require("../../models/store/Store");
const City = require("../../models/common/City");
const ErrorMessage = require("../../models/error/ErrorMessage");
const Product = require("../../models/product/Product");
const CartItem = require("../../models/client/CartItem");
const Image = require("../../models/common/Image");
const ClientFavouriteProduct = require("../../models/client/ClientFavouriteProduct");
const {Op} = require("sequelize");
const OTPValidation = require("../../models/common/OTPValidation");
const DeviceToken = require("../../models/common/UserDeviceToken");
const Order = require("../../models/order/Order");
const SystemUsersTypes = require("../../models/common/SystemUserTypes");
const axios = require("axios");

module.exports.login = async (req, res) => {
    const {login, password, code, otp_validation_id, device_token} = req.body;
    const {forgot_password} = req.query;
    const client = await Client.findOne({
        where: {[Op.or]: [{email: login}, {phone_number: login}]},
        attributes: ["id", "phone_number", "password", "name", "status", "cityName"]
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
            if (client && password) {
                const salt = genSaltSync(10);
                const hashedPassword = hashSync(password, salt);
                client.password = hashedPassword;
                await client.save();
                delete client.password;
                await validationCode.destroy();
                if (device_token) {
                    const deviceToken = await DeviceToken.findOne({where: {token: device_token, clientId: client.id}});
                    if (!deviceToken) {
                        await DeviceToken.create({token: device_token, clientId: client.id});
                    }
                }

                res.status(200).json({
                    data: {
                        token: generateJWT(client.id, UserTypes.CLIENT),
                        client_id: client.id,
                    }
                });
                return ;
            } else {
                throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
            }
        } else {
            const otp_validation_id = idGenerator();
            if (client) {
                const old = (await OTPValidation.findOne({where: {phone_number: client.phone_number}}));
                if (old) {
                    await old.destroy();
                }
                const code = Math.floor(100000 + Math.random() * 899999);
                await OTPValidation.create({
                    expiresAt: new Date(new Date().setMinutes(new Date().getMinutes() + 2)),
                    id: otp_validation_id,
                    phone_number: client.phone_number,
                    code
                });
                axios.post(`https://api.taqnyat.sa/v1/messages?bearerTokens=d5f7fd4e87a48f490ff5cfd2cb55553e&sender=sahm&recipients=966${client.phone_number.toString().trim().replace("0","")}&body=رمز التحقق الخاص بك هو : ${code}`).then(res=>{}).catch(err=>{
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
        if (client && compareSync(password, client.password)) {
            delete client.dataValues.password;
            if (device_token) {
                const deviceToken = await DeviceToken.findOne({where: {token: device_token, clientId: client.id}});
                if (!deviceToken) {
                    await DeviceToken.create({token: device_token, clientId: client.id});
                }
            }
            return res.status(200).json({
                data: {
                    token: generateJWT(client.id, UserTypes.CLIENT),
                    client_id: client.id,
                }
            });
        }
        throw new CustomError(404, new ErrorMessage("Wrong login or password", "خطأ في تسجيل الدخول أو كلمة المرور"));
    }

}


module.exports.createClient = async (req, res) => {
    const {
        owner_full_name,
        register_number,
        city,
        phone_number,
        password,
        name,
        email,
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
    const clientExists = await Client.findOne({
        attributes: {exclude: ['password']}, where: {
            [Op.or]: [(email&&{email}), {phone_number}, {register_number}]
        }
    });
    if (clientExists) {
        if (clientExists.phone_number === phone_number) {
            throw new CustomError(409, new ErrorMessage("phone number already in use", "رقم الهاتف مستخدم بالفعل"));
        }
        if (clientExists.email === email) {
            throw new CustomError(409, new ErrorMessage("email already in use", "البريد الإلكتروني مستخدم بالفعل"));
        }
        if (clientExists.register_number === register_number) {
            throw new CustomError(409, new ErrorMessage("register number already in use", "رقم التسجيل مستخدم بالفعل"));
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
        const client = await Client.create({
            register_number,
            owner_full_name,
            email,
            cityName: city,
            phone_number,
            password: hashedPassword,
            name,
        });
        if (device_token) {
            const deviceToken = await DeviceToken.findOne({where: {token: device_token, clientId: client.id}});
            if (!deviceToken) {
                await DeviceToken.create({token: device_token, clientId: client.id});
            }
        }
        await client.createCart({id: idGenerator()});
        const token = generateJWT(client.id, UserTypes.CLIENT);
        res.status(201).json({data: {token, client_id: client.id}});
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
            code
        });
        res.json({
            data: {
                otp_validation_id: otp_validation.id,
            }
        });
        axios.post(`https://api.taqnyat.sa/v1/messages?bearerTokens=d5f7fd4e87a48f490ff5cfd2cb55553e&sender=sahm&recipients=966${phone_number.toString().trim().replace("0","")}&body=رمز التحقق الخاص بك هو : ${code}`).then(res=>{}).catch(err=>{
            console.error(err);
        });
    }


}
module.exports.getClients = async (req, res) => {
    const {page_size = 12, page = 0,id} = req.query;
    const clients = await Client.findAll({
        limit: Number(page_size),
        offset: Number(page) * Number(page_size),
        attributes: {exclude: ["password","owner_full_name","phone_number","createdAt","updatedAt","email"]},
        where:{...(id&&{id})}
    });
    for (const client of clients){
        client.dataValues.orders_count = await Order.count({where:{clientId:client.id}});
    }
    res.json({
        data: clients
    });
}

module.exports.getClient = async (req, res) => {
    const {clientId} = req.params;
    const client = await Client.findByPk(clientId,{
        attributes: {exclude: ["password","createdAt","updatedAt"]},
        include:{
            model:Image,
            attributes:["url"]
        },
    });
    const cart = await client.getCart();
    client.dataValues.cart_count = await CartItem.count({where:{cartId:cart.id}});
    res.json({
        data:client
    });
}


module.exports.updateClient = async (req, res) => {
    const {clientId} = req.params;
    const {
        name,
        register_number,
        city,
        status,
        owner_full_name,
        password,
        phone_number,
        email
    } = req.body;
    const client = await Client.findByPk(clientId,{attributes: {exclude:["password"]}});
    client.set({
        ...(name && {name}),
        ...(email && {email}),
        ...(register_number && {register_number}),
        ...(city && {cityName:city}),
        ...(status && {status}),
        ...(owner_full_name && {owner_full_name}),
        ...(password && {password:hashSync(password,10)}),
        ...(phone_number&&{phone_number}),
    });
    const updatedClient = await client.save();
    delete updatedClient.password;
    res.json({data: {store: updatedClient}});
}


