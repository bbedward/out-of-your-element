// @ts-check

const assert = require("assert").strict
const Ty = require("../../types")

const passthrough = require("../../passthrough")
const { discord, sync, db } = passthrough

/**
 * @param {Ty.Event.Outer<Ty.Event.M_Reaction>} event
 */
async function addReaction(event) {
	const channelID = db.prepare("SELECT channel_id FROM channel_room WHERE room_id = ?").pluck().get(event.room_id)
	if (!channelID) return // We just assume the bridge has already been created
	const messageID = db.prepare("SELECT message_id FROM event_message WHERE event_id = ? AND part = 0").pluck().get(event.content["m.relates_to"].event_id) // 0 = primary
	if (!messageID) return // Nothing can be done if the parent message was never bridged.

	// no need to sync the matrix member to the other side. but if I did need to, this is where I'd do it

	const emoji = event.content["m.relates_to"].key // TODO: handle custom text or emoji reactions

	return discord.snow.channel.createReaction(channelID, messageID, emoji)
}

module.exports.addReaction = addReaction
