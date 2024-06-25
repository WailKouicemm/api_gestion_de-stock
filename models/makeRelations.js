const City = require("./common/City");
const Facture = require("./order/Facture");
const Fee = require("./order/MonthlyFee");
const Image = require("./common/Image");
const ClientNotification = require("./client/ClientNotification");
const StoreNotification = require("./store/StoreNotification");
const Order = require("./order/Order");
const OrderItem = require("./order/OrderItem");
const Product = require("./product/Product");
const ProductPriceDeduction = require("./product/ProductPriceDeduction");
const Store = require("./store/Store");
const StoreFeePayment = require("./store/StoreFeePayment");
const StorePolicy = require("./store/StorePolicy");
const Client = require("./client/Client");
const Admin = require("./admin/Admin");
const Cart = require("./client/Cart");
const CartItem = require("./client/CartItem");
const OTPValidation = require("./common/OTPValidation");
const SpecialOfferInfo = require("./product/SpecialOfferInfo");
const StoreAd = require("./store/StoreBanner");
const ClientFavouriteProduct= require("./client/ClientFavouriteProduct");
const UserDeviceToken= require("./common/UserDeviceToken");
const Ad= require("./ad/ad");

function makeRelations() {
    Client.belongsTo(City);
    City.hasMany(Client);


    Client.hasOne(Cart);
    Cart.belongsTo(Client);


    Cart.belongsToMany(Product,{through:CartItem});
    Product.belongsToMany(Cart,{through:CartItem});


    Client.hasMany(ClientNotification);
    ClientNotification.belongsTo(Client);


    Client.belongsToMany(Product,{through:ClientFavouriteProduct});
    Product.belongsToMany(Client,{through:ClientFavouriteProduct});

    Client.belongsTo(Image,{foreignKey:"client_image_id"});
    Client.hasMany(Order);
    Order.belongsTo(Client);

    Store.belongsTo(Image,{foreignKey:"store_image"});
    Store.belongsTo(Image,{foreignKey:"register_image"});
    Store.belongsTo(City);
    City.hasMany(Store);


    Store.hasMany(StorePolicy);
    StorePolicy.belongsTo(Store);


    Store.hasMany(StoreFeePayment);
    StoreFeePayment.belongsTo(Store);


    Store.hasMany(Product);
    Product.belongsTo(Store);

    Store.hasMany(Ad);
    Ad.belongsTo(Store);

    Ad.belongsTo(Image);


    Store.hasMany(StoreNotification);
    StoreNotification.belongsTo(Store);

    StoreAd.belongsTo(Store);
    Store.hasMany(StoreAd);

    StoreAd.belongsTo(Image);
    Image.hasMany(StoreAd);


    Product.belongsTo(Image);
    Image.hasOne(Product);


    Store.hasMany(Order);
    Order.belongsTo(Store);



    Order.hasMany(Facture);
    Facture.belongsTo(Order);

    Order.belongsToMany(Product,{through:OrderItem});
    Product.belongsToMany(Order,{through:OrderItem});


    Product.hasMany(ProductPriceDeduction);
    ProductPriceDeduction.belongsTo(Product);

    Product.hasOne(SpecialOfferInfo);
    SpecialOfferInfo.belongsTo(SpecialOfferInfo);


    SpecialOfferInfo.belongsTo(Image);
    Image.hasMany(SpecialOfferInfo);

    Store.hasMany(UserDeviceToken);
    UserDeviceToken.belongsTo(Store);


    Client.hasMany(UserDeviceToken);
    UserDeviceToken.belongsTo(Client);
}

module.exports = makeRelations;