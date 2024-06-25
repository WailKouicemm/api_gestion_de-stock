const UsersType = require("../models/common/SystemUserTypes");
const Store = require("../models/store/Store");
const {v1: idGenerator} = require("uuid");
const Ad = require("../models/ad/ad");
const Image = require("../models/common/Image");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
const SystemUserTypes = require("../models/common/SystemUserTypes");
const {QueryTypes} = require("sequelize");
const db = require("../config/connectDB");
module.exports.getAds = async (req, res) => {
    let includeItem;
    if (req.user.type===SystemUserTypes.ADMIN){
        includeItem = [{
            model: Image,
            attributes: ["url"]
        }];
    }else{
        const ads = (await db.query(`select ads.*,url from ads left outer join stores on ads.storeId=stores.id join images on ads.imageId=images.id where ads.deleted=0 and (storeId is null or stores.cityName="${req.user.cityName}") order by ads.createdAt desc`,{type:QueryTypes.SELECT})).map(item=>{
            return {id:item.id,
                storeId:item.storeId,
                image:{url:item.url},
            }

        });
        return res.json({data: ads});
    }
    const ads = await Ad.findAll({
        where: {deleted: false},
        attributes: {exclude: ["createdAt", "deleted", "imageId"]},
        include: includeItem
    });
    return res.json({data: ads});
}

module.exports.deleteAd = async (req, res) => {
    const {adId} = req.params;
    const ad = await Ad.findByPk(adId);
    if (!ad) {
        throw new CustomError(404, new ErrorMessage("ad not found", "لم يتم العثور على المتجر"));
    }
    ad.deleted = true;
    await ad.save();
    return res.json({data: ad});

}
module.exports.createAd = async (req, res) => {
    const {storeId: store_id} = req.body;
    if (!req.file){
        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
    if (store_id){
        const store = await Store.findByPk(store_id);
        if (!store){
            throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
        }
    }
    const image = await Image.create({id:idGenerator(),url: process.env.SERVER_URL + req.file.filename})
    const ad = await Ad.create({imageId:image.id,storeId: store_id?store_id:null});
    res.json({data:ad.id});
}
