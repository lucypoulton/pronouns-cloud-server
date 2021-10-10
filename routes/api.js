const mysql = require("mysql2/promise");
const config = require("../config.json")

module.exports = function (app) {

    app.get('/api/', async (req, res) => {
        const conn = await app.pool.getConnection();
        const [result, _] = await conn.execute("SELECT * FROM sets;");
        conn.release();

        res.json(result);
        res.end();
    });

    const createError = (res, err) => res.status(400).json({error: err}).send();

    app.post("/api/", async (req, res) => {
        if (!req.body || !req.body.set || !req.body.source) {
            createError(res, "Missing keys from body");
            return;
        }

        if (req.body.set.length > 255) {
            createError(res, "Set is too long");
            return;
        }

        const setSplit = req.body.set.split("/");
        if (setSplit.length !== 6) {
            createError(res, "Incorrectly formatted set");
            return;
        }

        const conn = await app.pool.getConnection();
        await conn.execute("INSERT IGNORE INTO moderation_queue VALUES (?, ?, ?) WHERE NOT EXISTS (SELECT setName from sets WHERE setName=?)",
            [req.body.set, new Date(), req.body.source, req.body.set]);
        conn.release();
        res.status(204).send();
    })
}