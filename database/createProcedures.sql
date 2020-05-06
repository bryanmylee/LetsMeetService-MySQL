USE lets_meet;

CREATE PROCEDURE get_event_details(IN _url_id VARCHAR(255))
    SELECT id, title, description, date_created FROM event
    WHERE url_id = _url_id;

CREATE PROCEDURE get_event_intervals(IN _id INT)
    SELECT start_dtime, end_dtime FROM event_interval
    WHERE event_id = _id;

CREATE PROCEDURE get_event_users(IN _id INT)
    SELECT username, start_dtime, end_dtime FROM user_interval
    WHERE event_id = _id;