DROP DATABASE IF EXISTS lets_meet;
CREATE DATABASE lets_meet;
USE lets_meet;
SET GLOBAL time_zone = '+00:00';


CREATE TABLE `user` (
    id           INT          NOT NULL AUTO_INCREMENT,
    username     VARCHAR(255) NOT NULL UNIQUE, INDEX(username(10)),
    display_name VARCHAR(255),
    password     BINARY(60)   NOT NULL, /* Bcrypt hash */
    PRIMARY KEY (id)
);

CREATE TABLE `event` (
    id           INT          NOT NULL AUTO_INCREMENT,
    url_id       VARCHAR(255) NOT NULL UNIQUE, INDEX(url_id(10)),
    title        VARCHAR(255) NOT NULL,
    description  VARCHAR(255) NOT NULL DEFAULT "",
    date_created DATETIME     NOT NULL DEFAULT NOW(),
    owner_id     INT,
    PRIMARY KEY (id),
    FOREIGN KEY (owner_id) REFERENCES `user`(id) ON DELETE SET NULL
);

CREATE TABLE `event_timing` (
    event_id    INT      NOT NULL,
    start_dtime DATETIME NOT NULL,
    end_dtime   DATETIME NOT NULL,
    PRIMARY KEY (event_id, start_dtime),
    FOREIGN KEY (event_id) REFERENCES `event`(id) ON DELETE CASCADE
);

CREATE TABLE `temp_user` (
    event_id  INT          NOT NULL,
    temp_name VARCHAR(255) NOT NULL,
    password  BINARY(60)   NOT NULL,
    PRIMARY KEY (event_id, temp_name),
    FOREIGN KEY (event_id) REFERENCES `event`(id) ON DELETE CASCADE
);

CREATE TABLE `temp_timing` (
    event_id    INT          NOT NULL,
    temp_name   VARCHAR(255) NOT NULL,
    start_dtime DATETIME     NOT NULL,
    end_dtime   DATETIME     NOT NULL,
    PRIMARY KEY (event_id, temp_name, start_dtime),
    FOREIGN KEY (event_id, temp_name) REFERENCES `temp_user`(event_id, temp_name) ON DELETE CASCADE
);

CREATE TABLE `schedule` (
    event_id INT NOT NULL,
    user_id  INT NOT NULL,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES `event`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES `user`(id) ON DELETE CASCADE
);

CREATE TABLE `timing` (
    event_id    INT      NOT NULL,
    user_id     INT      NOT NULL,
    start_dtime DATETIME NOT NULL,
    end_dtime   DATETIME NOT NULL,
    PRIMARY KEY (event_id, user_id, start_dtime),
    FOREIGN KEY (event_id, user_id) REFERENCES `schedule`(event_id, user_id) ON DELETE CASCADE
);

