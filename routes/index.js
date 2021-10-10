module.exports = function (app) {

    app.get('/', async (req, res) => {
        const conn = await app.pool.getConnection();
        const [result] = await conn.execute("SELECT * FROM sets;");
        conn.release();

        res.render('index', {
            title: 'Express',
            user: req.oidc.user,
            sets: result.map(entry => entry.setName)
        });
    });
}