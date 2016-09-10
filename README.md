# sogo mail.core.io mail api user importer

Fetch a remote JSON file with the mail.core.io api schema (http://mail.core.io/api/#basic)
and push it into a sogo compatible postgresql database.

## Env Variables

* `PGUSER` postgres user (default: postgres)
* `PGDATABASE` database (default: sogo)
* `PGPASSWORD` password (default: sogo)
* `PGHOST` host (default: localhost)
* `PGPORT` port (default: 5432)

## Usage

```sh
node index.js <url-to-json>
```

## Example Call
```sh
 PGHOST=192.168.15.138 PGPASSWORD=secret node index.js https://some.srv.customer.skylime.net/mail/export.json?token=232323232323
```

