// @ts-check

const repl = require("repl")
const util = require("util")
const {addbot} = require("../addbot")

const passthrough = require("./passthrough")
const {discord, sync, db} = passthrough

const data = sync.require("../test/data")
const createSpace = sync.require("./d2m/actions/create-space")
const createRoom = sync.require("./d2m/actions/create-room")
const registerUser = sync.require("./d2m/actions/register-user")
const mreq = sync.require("./matrix/mreq")
const api = sync.require("./matrix/api")
const file = sync.require("./matrix/file")
const sendEvent = sync.require("./m2d/actions/send-event")
const eventDispatcher = sync.require("./d2m/event-dispatcher")
const updatePins = sync.require("./d2m/actions/update-pins")
const speedbump = sync.require("./d2m/actions/speedbump")
const ks = sync.require("./matrix/kstate")
const guildID = "112760669178241024"

const extraContext = {}

if (process.stdin.isTTY) {
	setImmediate(() => { // assign after since old extraContext data will get removed
		if (!passthrough.repl) {
			const cli = repl.start({ prompt: "", eval: customEval, writer: s => s })
			Object.assign(cli.context, extraContext, passthrough)
			passthrough.repl = cli
		} else {
			Object.assign(passthrough.repl.context, extraContext)
		}
		sync.addTemporaryListener(passthrough.repl, "exit", () => process.exit())
	})
}

/**
 * @param {string} input
 * @param {import("vm").Context} _context
 * @param {string} _filename
 * @param {(err: Error | null, result: unknown) => unknown} callback
 */
async function customEval(input, _context, _filename, callback) {
	let depth = 0
	if (input === "exit\n") return process.exit()
	if (input === "addbot\n") return callback(null, addbot())
	if (input.startsWith(":")) {
		const depthOverwrite = input.split(" ")[0]
		depth = +depthOverwrite.slice(1)
		input = input.slice(depthOverwrite.length + 1)
	}
	let result
	try {
		result = await eval(input)
		const output = util.inspect(result, false, depth, true)
		return callback(null, output)
	} catch (e) {
		return callback(null, util.inspect(e, false, 100, true))
	}
}

sync.events.once(__filename, () => {
	for (const key in extraContext) {
		delete passthrough.repl.context[key]
	}
})
