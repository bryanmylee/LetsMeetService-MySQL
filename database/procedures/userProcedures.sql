USE lets_meet;

/*
 * |-------|
 * | Users |
 * |-------|
 */
CREATE PROCEDURE set_refresh_token(
        IN _event_id INT,
        IN _username VARCHAR(255),
        IN _refresh_token TEXT)
    UPDATE event_user
        SET refresh_token = _refresh_token
        WHERE event_id = _event_id
        AND username = _username;

CREATE PROCEDURE insert_new_user(
        IN _event_url VARCHAR(255),
        IN _username VARCHAR(255),
        IN _password VARCHAR(255))
    INSERT INTO event_user (event_id, username, password)
    SELECT id, _username, _password FROM event
    WHERE url_id = _event_url;
