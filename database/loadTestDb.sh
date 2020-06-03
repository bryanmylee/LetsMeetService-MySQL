cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")";
# Load .env as environment variables
# -0 delimits by newlines on BSD systems.
export $(egrep -v '^#' ../.env | xargs -0)

dropdb lets_meet;
createdb lets_meet;
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f ./tables.sql;
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f ./testData.sql;
