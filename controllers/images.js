require("express-async-errors");

const {v1: idGenerator} = require("uuid");

const Image = require("../models/common/Image");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
const {Op} = require("sequelize");

module.exports.addImages = async (req, res) => {
    const {name_ar,name_en} = req.body;
    if (req.files) {
        const images = req.files.map(item => {
            return {id: idGenerator(), type: "PUBLIC", url: process.env.SERVER_URL + item.filename, name_ar,name_en}
        });
        await Image.bulkCreate(images);
        return res.json({images});
    }
    throw new CustomError(400, new ErrorMessage("no files provided", "لم يتم تقديم أي ملفات"));
}

module.exports.deleteImage = async (req, res) => {
    const {imageId} = req.params;
    const image = await Image.findByPk(imageId);
    if (!image) {
        throw new CustomError(404, new ErrorMessage("image not found", "صورة غير موجود"));
    }
    image.deleted = true;
    await image.save();
    res.json({image});
}
module.exports.updateImage = async (req, res) => {
    const {imageId} = req.params;
    const {name_ar,name_en} = req.body;
    const image = await Image.findByPk(imageId);
    if (!image) {
        throw new CustomError(404, new ErrorMessage("image not found", "صورة غير موجود"));
    }
    image.set({
        ...(name_ar && {name_ar}),
        ...(name_en && {name_en}),
    });
    await image.save();
    res.json({image});
}
module.exports.getImages = async (req, res) => {
    const {page = 0, page_size = 12} = req.query;
    const {q} = req.query;
    const images = await Image.findAll({
        where: {
            type: "PUBLIC", deleted: false, ...(q && {
                [Op.or]: [
                    {
                        name_ar: {
                            [Op.like]:
                                `%${q}%`
                        }
                    }, {
                        name_en: {
                            [Op.like]:
                                `%${q}%`
                        }
                    }
                ]
            })
        },
        limit: Number(page_size),
        offset: Number(page) * Number(page_size),
    });
    res.json({images});
}