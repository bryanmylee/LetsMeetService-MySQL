SET SESSION TIME ZONE '+00:00';

CREATE TABLE event (
    id            BIGSERIAL    NOT NULL,
    url_id        VARCHAR(255) UNIQUE,
    title         VARCHAR(255) NOT NULL,
    description   VARCHAR(255) NOT NULL DEFAULT '',
    dtime_created TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

CREATE TABLE event_interval (
    event_id    INT       NOT NULL,
    start_dtime TIMESTAMP NOT NULL,
    end_dtime   TIMESTAMP NOT NULL,
    PRIMARY KEY (event_id, start_dtime),
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);

CREATE TABLE event_user (
    event_id      INT          NOT NULL,
    username      VARCHAR(255) NOT NULL,
    password      CHAR(60)     NOT NULL,
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
    refresh_token TEXT,
    PRIMARY KEY (event_id, username),
    FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE
);

CREATE TABLE user_interval (
    event_id    INT          NOT NULL,
    username    VARCHAR(255) NOT NULL,
    start_dtime TIMESTAMP    NOT NULL,
    end_dtime   TIMESTAMP    NOT NULL,
    PRIMARY KEY (event_id, username, start_dtime),
    FOREIGN KEY (event_id, username)
            REFERENCES event_user(event_id, username) ON DELETE CASCADE
);
