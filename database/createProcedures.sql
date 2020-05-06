USE lets_meet;

CREATE PROCEDURE get_event_details(IN _url_id VARCHAR(255))
    SELECT id, title, description, date_created FROM event
    WHERE url_id = _url_id;