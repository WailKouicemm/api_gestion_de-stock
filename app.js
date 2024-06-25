const express = require('express');

const logger = require('morgan');
require("dotenv").config();
const cron = require("node-cron");
const db = require("./config/connectDB");
const makeRelations = require("./models/makeRelations");
const path = require("path");
const app = express();
const authenticate = require("./middlewares/authenticate");
const adminCheck = require("./middlewares/adminCheck");
const Store = require("./models/store/Store");
const {QueryTypes} = require("sequelize");
app.use(express.static(path.join(".", "storage")));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use((req, res, next) => {
    req.language = req.headers["content-language"] ? req.headers["content-language"] : "ar-SA";
    next();
});
const task = cron.schedule("0 0 5 * *", async () => {
    const storesIds = (await db.query("select id from stores where id not in (select storeId from store_fee_payments where createdAt > now() - interval 1 month)",{type:QueryTypes.SELECT})).map(item=>item.id);
    await Store.update({status: "INVISIBLE"},{where:{id:storesIds}});
});
task.start()
app.use("/clients", require("./routes/clients"));
app.use("/admins", require("./routes/admins"));
app.use("/stores", require("./routes/stores"));
app.use("/products", require("./routes/products"));


app.use("/cities", require("./routes/cities"));
app.use("/ads", require("./routes/ads"));
app.use("/stats", authenticate, adminCheck, require("./routes/stats"));
app.use("/orders", authenticate, adminCheck, require("./routes/orders"));
app.use("/images", require("./routes/images"));
app.use("/fee-payments", require("./routes/images"));
app.use("/", (req, res) => {
    res.status(404).json({message: "route not found"});
});
app.use("*", require("./middlewares/errorHandler"));
makeRelations();

db.sync().then(() => {
        console.log("database synced");
        app.listen(5000, () => {
            console.log("server started");
        });
    }
)
