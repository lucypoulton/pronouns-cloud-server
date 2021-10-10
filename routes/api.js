module.exports = function (app) {

    app.get('/api/', async (req, res) => {
        const conn = await app.pool.getConnection();
        const [result] = await conn.execute("SELECT * FROM sets;");
        conn.release();

        res.json({
            source: "https://pn.lucypoulton.net",
            updatedAt: new Date(),
            sets: result.map(entry => entry.setName)
        });
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
        const [exists] = await conn.execute("SELECT 1 FROM sets WHERE setName=?", [req.body.set])
        if (!exists.length) {
            await conn.execute("INSERT IGNORE INTO moderation_queue VALUES (?, ?, ?)",
                [req.body.set, new Date(), req.body.source]);
        }
        conn.release();
        res.json({}).send();
    })
}