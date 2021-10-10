const oidc = require("express-openid-connect");

module.exports = function (app) {
    app.get('/moderation/', oidc.claimIncludes("roles", "ProNouns-Approver"), async (req, res) => {
        const conn = await app.pool.getConnection();
        const [result, _] = await conn.execute("SELECT * FROM moderation_queue;");
        conn.release();

        res.render("queue", {
            title: "Moderation Queue",
            user: req.oidc.user,
            entries: result
        })
    })
}