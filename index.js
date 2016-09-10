#!/usr/bin/env node

var async = require('async');
var request = require('sync-request');
var pg = require('pg');

var config = {
  user: process.env.PGUSER || 'postgres', //env var: PGUSER
  database: process.env.PGDATABASE || 'sogo', //env var: PGDATABASE
  password: process.env.PGPASSWORD || 'sogo', //env var: PGPASSWORD
  host: process.env.PGHOST || 'localhost', // Server hosting the postgres database
  port: process.env.PGPORT || 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

if (process.argv.length != 3) {
  console.log(process.argv[0] + " " + process.argv[1] + " <url-to-export-json>");
  process.exit(1);
}

var endpoint = process.argv[2];

// request file
var res = request('GET', endpoint);
users = JSON.parse(res.getBody());

var accountList = [];
Object.keys(users).forEach(function (key) {
	var accounts = users[key].account || [];
	accounts.forEach(function (acc) {
	  accountList.push([acc.name+'@'+key, acc.password]);
	});
})

console.log(accountList.length, 'users fetched from endpoint', endpoint);

// pg stuff
var client = new pg.Client(config);

var rollback = function(client) {
  //terminating a client connection will
  //automatically rollback any uncommitted transactions
  //so while it's not technically mandatory to call
  //ROLLBACK it is cleaner and more correct
  client.query('ROLLBACK', function() {
    console.log('do a rollback');
    client.end();
  });
};

// connect to our database
client.connect();

var tpl = 'INSERT INTO sogo_users (c_uid, c_name, c_password, c_cn, mail) VALUES($1, $1, $2, $1, $1)';
client.query('BEGIN', function(err) {
  if(err) return rollback(client);

  // delete old ones
  client.query('DELETE FROM sogo_users;', function (err, result) {
    if(err) return rollback(client);
    
    // insert
    async.every(accountList, function(account, callback) {
      client.query(tpl, account, function (err) { callback(null, !err); });
    }, function(err, result) {
      // if result is true then every file exists
      if (result) {
        client.query('COMMIT', function () {
          console.log('COMMIT Done');
          client.end();
	});
      } else {
        rollback(client);
      }
    });
  });
}); 


