#!/usr/bin/env node
// @ts-check

const {getDatabase} = require("../src/db/database")
const db = getDatabase({fileMustExist: true})
db.pragma("journal_mode = wal")
db.close()
