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

## Database Schema

```sql
-- Table: sogo_users

-- DROP TABLE sogo_users;

CREATE TABLE sogo_users
(
  c_uid character varying(512) NOT NULL,
  c_name character varying(512),
  c_password character varying(256),
  c_cn character varying(512),
  mail character varying(512),
  CONSTRAINT sogo_users_pkey PRIMARY KEY (c_uid)
)
WITH (
  OIDS=FALSE
);
```

## Sogo Configuration

```c
  SOGoUserSources =
    (
      {
        displayName = "Default";
        type = sql;
        id = directory;
        viewURL = "postgresql://postgres:pwd@192.168.15.138:5432/sogo/sogo_users";
        canAuthenticate = YES;
        //isAddressBook = YES; // if you want the users to browse the others
        userPasswordAlgorithm = crypt;
      }
    );

```
