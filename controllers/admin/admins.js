const {Op} = require("sequelize");
const {compareSync} = require("bcrypt");
const generateJWT = require("../../functions/generateJWT");
const UserTypes = require("../../models/common/SystemUserTypes");
const CustomError = require("../../models/error/CustomError");
const Admin = require("../../models/admin/Admin");
const ErrorMessage = require("../../models/error/ErrorMessage");

module.exports.login = async (req, res) => {
    const {login, password} = req.body;
    const admin = await Admin.findOne({where: {[Op.or]: [{email: login}, {phone_number: login}]}});
    if (admin && compareSync(password, admin.password)) {
        delete admin.dataValues.password;
        return res.status(200).json({
            data: {
                token: generateJWT(admin.id, UserTypes.ADMIN),
            }
        });
    }
    throw new CustomError(404, new ErrorMessage("Wrong login or password", "خطأ في تسجيل الدخول أو كلمة المرور"));
}