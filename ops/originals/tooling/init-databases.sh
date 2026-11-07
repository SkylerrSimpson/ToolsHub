#!/bin/sh
set -eu
psql --username postgres --dbname postgres --set ON_ERROR_STOP=1 --set dict_password="$DICTIONARY_PASSWORD" --set dev_password="$DEVFINDER_PASSWORD" --set todo_password="$TODO_PASSWORD" <<'SQL'
CREATE ROLE dictionary_original LOGIN PASSWORD :'dict_password';
CREATE DATABASE dictionary_original OWNER dictionary_original;
REVOKE ALL ON DATABASE dictionary_original FROM PUBLIC;
CREATE DATABASE dictionary_original_test OWNER dictionary_original;
REVOKE ALL ON DATABASE dictionary_original_test FROM PUBLIC;
CREATE ROLE devfinder_original LOGIN PASSWORD :'dev_password';
CREATE DATABASE devfinder_original OWNER devfinder_original;
REVOKE ALL ON DATABASE devfinder_original FROM PUBLIC;
CREATE DATABASE devfinder_original_test OWNER devfinder_original;
REVOKE ALL ON DATABASE devfinder_original_test FROM PUBLIC;
CREATE ROLE todo_original LOGIN PASSWORD :'todo_password';
CREATE DATABASE todo_original OWNER todo_original;
REVOKE ALL ON DATABASE todo_original FROM PUBLIC;
CREATE DATABASE todo_original_test OWNER todo_original;
REVOKE ALL ON DATABASE todo_original_test FROM PUBLIC;
SQL
