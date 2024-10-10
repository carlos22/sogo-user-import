#!/usr/bin/env node
"use strict"
const async = require('async')
const pg = require('pg')
const http = require('urllib');


var config = {
	user:     process.env.PGUSER     || 'postgres',
	database: process.env.PGDATABASE || 'sogo',
	password: process.env.PGPASSWORD || 'sogo',
	host:     process.env.PGHOST     || 'localhost',
	port:     process.env.PGPORT     || 5432,

	max:      10,             // max number of clients in the pool
	idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
}

var verbose = process.env.VERBOSE || false


function fetch(u, cb) {
	http.request(u, {
		contentType: 'json',
		dataType: 'json',
		timeout: 20000,
	})
	.then((body) => {
		cb(null, body.data)
	})
	.catch((err) => {
		if(err.res.statusCode !== 200) {
			cb(Error("Request for " + u + " failed: " + String(err.res.statusCode) + " " + err.res.statusMessage))
			return
		}
		if(err.name == "JSONResponseFormatError") {
			cb(Error("Request for " + u + " failed: invalid json"))
			return
		}
		if(err) {
			cb(Error("Request for " + u + " failed: " + String(err)))
			return
		}
	})
}

function merge(arr) {
	var res = {}
	arr.forEach(function(item) {
		res = Object.assign(res, item)
	})
	return res
}

function flatten(users) {
	var accounts = []
	Object.keys(users).forEach(function (domain) {
		(users[domain].account || []).forEach(function (acc) {
			accounts.push([acc.name + '@' + domain, acc.password])
		})
	})
	return accounts
}


function insert(accounts) {
	var tpl = 'INSERT INTO sogo_users (c_uid, c_name, c_password, c_cn, mail) VALUES($1, $1, $2, $1, $1)'

	var client = new pg.Client(config)

	function rollback(err) {
		client.query('ROLLBACK', function() {
			console.error('Error: Database commit failed, rollback initiated', err)
			client.end()
		})
	}

	function commit() {
		client.query('COMMIT', function () {
			if(verbose) {
				console.log('COMMIT Done')
			}
			client.end()
		})
	}

	client.connect()
	client.query('BEGIN', function(err) {
		if(err) {
			rollback(err)
			return
		}

		// clear old users
		client.query('DELETE FROM sogo_users;', function (err, result) {
			if(err) {
				rollback(err)
				return
			}

			// insert
			async.every(accounts, function(account, callback) {
				client.query(tpl, account, function (err) {
					callback(null, !err)
				})
			}, function(err, result) {
				// if result is false there was an error
				if(err || !result) {
					rollback(err)
					return
				}

				commit()
			})
		})
	})
}


function main() {
	if(process.argv.length < 3) {
		console.log(process.argv[0] + " " + process.argv[1] + " <url-to-export-json>")
		process.exit(1)
	}

	async.map(process.argv.slice(2), fetch, function(err, result) {
		if(err) {
			console.error(err)
			return
		}

		var users    = merge(result)
		var accounts = flatten(users)

		if(verbose) {
			console.log(accounts.length + " users fetched")
		}

		insert(accounts)
	})
}

main()
