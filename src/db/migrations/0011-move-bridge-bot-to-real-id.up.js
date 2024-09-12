/*
	a. If the bridge bot sim already has the correct ID:
		- No rows updated.

	b. If the bridge bot sim has the wrong ID but there's no duplicate:
		- One row updated.

	c. If the bridge bot sim has the wrong ID and there's a duplicate:
		- One row updated (replaces an existing row).
*/

module.exports = async function(db) {
	const config = require("../../../config")
	const id = Buffer.from(config.discordToken.split(".")[0], "base64").toString()
	db.prepare("UPDATE OR REPLACE sim SET user_id = ? WHERE user_id = '0'").run(id)
}
