#!/usr/bin/env node
// @ts-check

const fs = require("fs")
const migrate = require("./src/db/migrate")
const HeatSync = require("heatsync")

const {reg} = require("./src/matrix/read-registration")
const passthrough = require("./src/passthrough")
const {getDatabase} = require("./src/db/database")
const db = getDatabase()

const sync = new HeatSync({watchFunction: fs.watchFile})

Object.assign(passthrough, {sync, db})

const DiscordClient = require("./src/d2m/discord-client")

const discord = new DiscordClient(reg.ooye.discord_token)
passthrough.discord = discord

const {as} = require("./src/matrix/appservice")
passthrough.as = as

const orm = sync.require("./src/db/orm")
passthrough.from = orm.from
passthrough.select = orm.select

const power = require("./src/matrix/power.js")
sync.require("./src/m2d/event-dispatcher")

;(async () => {
	await migrate.migrate(db)
	await discord.cloud.connect()
	console.log("Discord gateway started")
	sync.require("./src/web/server")
	await power.applyPower()

	discord.cloud.once("ready", () => {
		as.listen()
	})

	require("./src/stdin")
})()
