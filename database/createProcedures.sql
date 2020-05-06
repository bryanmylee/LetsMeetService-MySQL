USE lets_meet;

/*
 * |--------|
 * | Events |
 * |--------|
 */
CREATE PROCEDURE get_event_details(IN _url_id VARCHAR(255))
    SELECT id, title, description, date_created FROM event
    WHERE url_id = _url_id;

CREATE PROCEDURE get_event_intervals(IN _event_id INT)
    SELECT start_dtime, end_dtime FROM event_interval
    WHERE event_id = _event_id;

CREATE PROCEDURE get_event_users(IN _event_id INT)
    SELECT username, start_dtime, end_dtime FROM user_interval
    WHERE event_id = _event_id;

/*
 * Event intervals and user intervals need to be done with a batch insert.
 *
 * If url_id is not unique, throw (1062, "Duplicate entry <url_id> for key ...")
 */
DELIMITER $$
CREATE PROCEDURE create_new_event(
        IN _url_id VARCHAR(255),
        IN _title VARCHAR(255),
        IN _description VARCHAR(255),
        IN _username VARCHAR(255),
        IN _password CHAR(60))
    BEGIN
    INSERT INTO event (url_id, title, description) VALUES
        (_url_id, _title, _description);
    INSERT INTO event_user (event_id, username, password, is_admin) VALUES
        (LAST_INSERT_ID(), _username, _password, TRUE);
    END$$
DELIMITER ;

CREATE PROCEDURE set_refresh_token(
        IN _event_id INT,
        IN _username VARCHAR(255),
        IN _refresh_token CHAR(60))
    UPDATE event_user
        SET refresh_token = _refresh_token
        WHERE event_id = _event_id
        AND username = _username;