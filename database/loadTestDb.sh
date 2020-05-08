cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")";
# Load .env as environment variables
# -0 delimits by newlines on BSD systems.
export $(egrep -v '^#' ../.env | xargs -0)

mysql -u"$DB_USER" -p"$DB_PASS" < ./tables.sql;
mysql -u"$DB_USER" -p"$DB_PASS" < ./testData.sql;

