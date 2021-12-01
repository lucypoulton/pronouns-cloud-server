export default function (app) {

    app.get('/', async (req, res) => {
        const conn = await app.pool.getConnection();
        const [result] = await conn.execute("SELECT * FROM sets;");
        conn.release();

        res.render('index', {
            title: 'ProNouns Cloud',
            user: req.oidc.user,
            sets: result.map(entry => entry.setName)
        });
    });

    app.get('/add', (req, res) =>
        res.render('add', {
            title: 'Add your pronouns',
            user: req.oidc.user,
        }));
}