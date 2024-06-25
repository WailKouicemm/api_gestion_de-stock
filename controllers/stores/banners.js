const StoreBanner = require("../../models/store/StoreBanner");
const Image = require("../../models/common/Image");
const CustomError = require("../../models/error/CustomError");
const ErrorMessage = require("../../models/error/ErrorMessage");
const {v1: idGenerator} = require("uuid");
module.exports.getBanners = async (req, res) => {
    const {storeId} = req.params;
    const banners = await StoreBanner.findAll({
        where: {storeId},
        attributes: ["id"],
        order: [["createdAt", "DESC"]],
        include: {model: Image, attributes: ["url"]}
    });
    res.json({data: banners});
}
module.exports.deleteBanner = async (req, res) => {
    const {storeId} = req.params;
    const {bannerId} = req.params;
    const banner = await StoreBanner.findOne({
        where: {storeId, id: bannerId},
        attributes: ["id"],
        order: [["createdAt", "DESC"]],
    });
    if (!banner) {
        throw new CustomError(404, new ErrorMessage("banner not found", "اللافتة غير موجودة"));
    }
    await banner.destroy();
    res.json({data: {banner}});
}
module.exports.addBanner = async (req, res) => {
    const {storeId} = req.params;
    if (!req.file){
        throw new CustomError(400, new ErrorMessage("invalid request", "طلب غير صالح"));
    }
    const image = await Image.create({url: process.env.SERVER_URL + req.file.filename, id: idGenerator()});
    const banner = await StoreBanner.create({storeId, imageId: image.id});
    banner.dataValues.image = {url: image.url};
    delete banner.dataValues.imageId;
    delete banner.dataValues.createdAt;
    delete banner.dataValues.storeId;
    res.json({data: banner});
}