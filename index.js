const express = require("express");
const expressLayouts = require("express-ejs-layouts")
const logger = require("morgan")
const path = require("path");
const cookieParser = require("cookie-parser");
const createError = require("http-errors");
const {auth} = require("express-openid-connect");
require("dotenv").config();

const app = express();
const config = require("./config.json")
const mysql = require("mysql2/promise");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
    require("./routes/index")(app);
    require("./routes/moderation")(app);
    require("./routes/api")(app);


// catch 404 and forward to error handler
    app.use(function (req, res, next) {
        next(createError(404));
    });

// error handler
    app.use(function (err, req, res, next) {
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