const City = require("../models/common/City");
const CustomError = require("../models/error/CustomError");
const ErrorMessage = require("../models/error/ErrorMessage");
module.exports.addCity = async (req, res) => {
    const {name, name_ar} = req.body;
    if ((await City.findByPk(name))) {
        throw new CustomError(404, new ErrorMessage("city not found", "المدينة غير موجودة"));
    }
    const city = await City.create({name, name_ar});
    res.status(201).json({data: {city}});
}
module.exports.getAllCities = async (req, res) => {
    res.json({data: {cities: await City.findAll()}});
}

