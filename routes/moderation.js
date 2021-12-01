import oidc from "express-openid-connect";

export default function (app) {
    app.get('/moderation/', oidc.requiresAuth(), async (req, res) => {
        if (!req.oidc.user.roles.includes("ProNouns-Approver")) {
            res.render("error", {
                "error": {
                    "status": "You don't have permission to access this page.",
                    "stack": ""
                }
            });
            return;
        }
        const conn = await app.pool.getConnection();
        const [result] = await conn.execute("SELECT * FROM moderation_queue;");
        conn.release();

        res.render("queue", {
            title: "Moderation Queue",
            user: req.oidc.user,
            entries: result
        })
    });

    const createError = (res, err) => res.status(400).json({error: err}).send();

    app.post("/moderation/", oidc.requiresAuth(), async (req, res) => {
        if (!req.oidc.user.roles.includes("ProNouns-Approver")) {
            res.json({error: "Unauthorized"}).status(403).send();
            return;
        }

        if (!req.body.set || !req.body.action) {
            createError(res, "Missing keys from body")
            return;
        }
        if (!["approve", "reject"].includes(req.body.action)) {
            createError(res, `Unknown action "${req.body.action}"`);
            return;
        }

        const conn = await app.pool.getConnection();
        const [setExists] = await conn.execute("DELETE FROM moderation_queue WHERE setName=?", [req.body.set]);

        if (setExists.affectedRows === 0) {
            createError(`Unknown set "${req.body.set}"`);
            return;
        }

        if (req.body.action === "approve") {
            await conn.execute("INSERT INTO sets VALUES (?)", [req.body.set]);
        }

        res.json({}).send();
    })
}