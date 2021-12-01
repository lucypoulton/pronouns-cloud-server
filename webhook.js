import fetch from "node-fetch";

import config from "./config.json" assert {type: "json"};

export default {
    async _post(title, fields, description = null) {
        const webhook = config.webhook;
        if (webhook === undefined) return;

        await fetch(config.webhook, {
            "method": "POST",
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                embeds: [{
                    color: 11510504,
                    description: description,
                    title: title,
                    fields: fields,
                    timestamp: new Date().toISOString()
                }]
            })
        });
    },

    async onSubmit(set, source) {
        await this._post("New set submitted", [
            {name: "Set", value: set},
            {name: "Source", value: source}
        ],
            `${config.oidc.baseURL}/moderation`)
    }
}