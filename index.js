import express from "express";
import expressLayouts from "express-ejs-layouts";
import logger from "morgan";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import {auth} from "express-openid-connect";

import config from "./config.json" assert {type: "json"};
import mysql from "mysql2/promise";

import moderationRoutes from "./routes/moderation.js";
import indexRoutes from "./routes/index.js";
import apiRoutes from "./routes/api.js";

const app = express();
// view engine setup
app.set('views', 'views');
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static('public'));

app.use(
    auth({
        ...config.oidc,
        authRequired: false,
        idpLogout: true,
    })
);

app.use(express.json());

app.pool = mysql.createPool(config.mysql);

(async () => {
    const conn = await app.pool.getConnection();
    await conn.execute("CREATE TABLE IF NOT EXISTS sets (setName VARCHAR(50) PRIMARY KEY)");
    await conn.execute("CREATE TABLE IF NOT EXISTS moderation_queue (setName VARCHAR(50) PRIMARY KEY, time DATETIME, source TEXT)");
    conn.release();
})().then(() => {
    indexRoutes(app);
    moderationRoutes(app);
    apiRoutes(app);


// catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

// error handler
    app.use(function (err, req, res) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

    app.listen(config.port, () => {
        console.log(`Listening on port ${config.port}`);
    });
});