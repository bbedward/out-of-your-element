// @ts-check

const sqlite = require("better-sqlite3")
const path = require("path")

/**
 * Open the OOYE database from OOYE_DATA_DIR (or the working directory).
 * @param {import("better-sqlite3").Options} [options]
 * @returns {import("better-sqlite3").Database}
 */
function getDatabase(options = {}) {
	const dataDir = process.env.OOYE_DATA_DIR || process.cwd()
	return new sqlite(path.join(dataDir, "ooye.db"), options)
}

module.exports = {getDatabase}
