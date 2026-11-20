// @ts-check

const fsp = require("fs").promises
const {join} = require("path")
const emojisp = fsp.readFile(join(__dirname, "emojis.txt"), "utf8").then(content => content.split("\n"))

const passthrough = require("../../passthrough")
const {select} = passthrough


/**
 * @param {string} input
 * @param {string | null | undefined} shortcode
 * @returns {string?}
 */
function encodeCustomEmoji(input, shortcode) {
	// Custom emoji
	let row = select("emoji", ["emoji_id", "name"], {mxc_url: input}).get()
	if (!row && shortcode) {
		// Use the name to try to find a known emoji with the same name.
		const name = shortcode.replace(/^:|:$/g, "")
		row = select("emoji", ["emoji_id", "name"], {name: name}).get()
	}
	if (!row) {
		// We don't have this emoji and there's no realistic way to just-in-time upload a new emoji somewhere. Sucks!
		return null
	}
	return encodeURIComponent(`${row.name}:${row.emoji_id}`)
}

/**
 * @param {string} input
 * @returns {Promise<string?>} URL encoded!
 */
async function encodeDefaultEmoji(input) {
	// Default emoji

	// Shortcut: If there are ASCII letters then it's not an emoji, it's a freeform Matrix text reaction.
	// (Regional indicator letters are not ASCII. ASCII digits might be part of an emoji.)
	if (input.match(/[A-Za-z]/)) return null

	// Check against the dataset
	const emojis = await emojisp
	const encoded = encodeURIComponent(input)

	// ™, ® and © are weird, because they exist in two forms: emoji and text...
	// ... and discord prefers the text version
	// so if someone reacts with the emoji version, convert it to the text version discord wants
	if (input === "™️") return encodeURIComponent("™")
	if (input === "®️") return encodeURIComponent("®")
	if (input === "©️") return encodeURIComponent("©")

	// Best case scenario: they reacted with an exact replica of a valid emoji.
	if (emojis.includes(input)) return encoded

	// Maybe it has some extraneous \ufe0f or \ufe0e (at the end or in the middle), and it'll be valid if they're removed.
	const trimmed = input.replace(/\ufe0e|\ufe0f/g, "")
	const trimmedEncoded = encodeURIComponent(trimmed)
	if (trimmed !== input) {
		if (emojis.includes(trimmed)) return trimmedEncoded
	}

	// Okay, well, maybe it was already missing one and it actually needs an extra \ufe0f, and it'll be valid if that's added.
	else {
		const appended = input + "\ufe0f"
		const appendedEncoded = encodeURIComponent(appended)
		if (emojis.includes(appended)) return appendedEncoded
	}

	// Hmm, so adding or removing that from the end didn't help, but maybe there needs to be one in the middle? We can try some heuristics.
	// These heuristics come from executing scripts/emoji-surrogates-statistics.js.
	if (trimmedEncoded.length <= 21 && trimmed.match(/^[*#0-9]/)) { // ->19: Keycap digit? 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ *️⃣ #️⃣
		const keycap = trimmed[0] + "\ufe0f" + trimmed.slice(1)
		if (emojis.includes(keycap)) return encodeURIComponent(keycap)
	} else if (trimmedEncoded.length === 27 && trimmed[0] === "⛹") { // ->45: ⛹️‍♀️ ⛹️‍♂️
		const balling = trimmed[0] + "\ufe0f" + trimmed.slice(1) + "\ufe0f"
		if (emojis.includes(balling)) return encodeURIComponent(balling)
	} else if (trimmedEncoded.length === 30) { // ->39: ⛓️‍💥 ❤️‍🩹 ❤️‍🔥 or ->48: 🏳️‍⚧️ 🏌️‍♀️ 🕵️‍♀️ 🏋️‍♀️ and gender variants
		const thriving = trimmed[0] + "\ufe0f" + trimmed.slice(1)
		if (emojis.includes(thriving)) return encodeURIComponent(thriving)
		const powerful = trimmed.slice(0, 2) + "\ufe0f" + trimmed.slice(2) + "\ufe0f"
		if (emojis.includes(powerful)) return encodeURIComponent(powerful)
	} else if (trimmedEncoded.length === 51 && trimmed[3] === "❤") { // ->60: 👩‍❤️‍👨 👩‍❤️‍👩 👨‍❤️‍👨
		const yellowRomance = trimmed.slice(0, 3) + "❤\ufe0f" + trimmed.slice(4)
		if (emojis.includes(yellowRomance)) return encodeURIComponent(yellowRomance)
	}

	// there are a few more longer ones but I got bored
	return null
}

/**
 * @param {string} input
 * @param {string | null | undefined} shortcode
 * @returns {Promise<string?>}
 */
async function encodeEmoji(input, shortcode) {
	if (input.startsWith("mxc://")) {
		return encodeCustomEmoji(input, shortcode)
	} else {
		return encodeDefaultEmoji(input)
	}
}

module.exports.encodeEmoji = encodeEmoji
