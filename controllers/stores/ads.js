const CustomError = require("../../models/error/CustomError");
const ErrorMessage = require("../../models/error/ErrorMessage");
const Image = require("../../models/common/Image");
const {v1: idGenerator} = require("uuid");
const Ad = require("../../models/ad/ad");
const Store = require("../../models/store/Store");
module.exports.createAd = async (req, res) => {
   const {storeId} = req.params;
    if (!req.file){
        throw new CustomError(400,new ErrorMessage("invalid request","طلب غير صالح"));
    }
        const store = await Store.findByPk(storeId);
        if (!store) {
            throw new CustomError(404, new ErrorMessage("store not found", "لم يتم العثور على المتجر"));
        }
    const image = await Image.create({id:idGenerator(),url: process.env.SERVER_URL + req.file.filename})
    const ad = await Ad.create({imageId:image.id,storeId});
    res.json({data:ad.id});
}