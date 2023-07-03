const {test} = require("supertape")
const {path} = require("./api")

test("api path: no change for plain path", t => {
	t.equal(path("/hello/world"), "/hello/world")
})

test("api path: add mxid to the URL", t => {
	t.equal(path("/hello/world", "12345"), "/hello/world?user_id=12345")
})

test("api path: empty path with mxid", t => {
	t.equal(path("", "12345"), "/?user_id=12345")
})

test("api path: existing query parameters with mxid", t => {
	t.equal(path("/hello/world?foo=bar&baz=qux", "12345"), "/hello/world?foo=bar&baz=qux&user_id=12345")
})

test("api path: real world mxid", t => {
	t.equal(path("/hello/world", "@cookie_monster:cadence.moe"), "/hello/world?user_id=%40cookie_monster%3Acadence.moe")
})
