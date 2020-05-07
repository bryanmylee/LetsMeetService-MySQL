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

/*
 * If (event_id, username) is not unique, throw (1062, "Duplicate entry
 * <event_id-username> for key ...")
 */
CREATE PROCEDURE insert_new_user(
        IN _event_id INT,
        IN _username VARCHAR(255),
        IN _password VARCHAR(255))
    INSERT INTO event_user (event_id, username, password) VALUES
    (_event_id, _username, _password);

CREATE PROCEDURE get_user_credentials(
        IN _event_id INT,
        IN _username VARCHAR(255))
    SELECT password FROM event_user
    WHERE event_id = _event_id
    AND username = _username;

CREATE PROCEDURE get_user_refresh_token(
        IN _event_id INT,
        IN _username VARCHAR(255))
    SELECT refresh_token FROM event_user
    WHERE event_id = _event_id
    AND username = _username;
