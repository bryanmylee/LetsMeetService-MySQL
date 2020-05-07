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