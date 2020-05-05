USE lets_meet;

INSERT INTO `user`(id, username, display_name, password) VALUES
(1, "adam", "Adam", "$2b$10$U0tDjy066EGn43ofqQAaKu.K6i278wcT0o7ypLi/FfHh6o496cUuS"),
(2, "bran", "Bran", "$2b$10$gt7PSFaSn1K0YJhqRn1xgOe5DgiM65ji8yiQDfTq/P0A0vKA4QMMa");

INSERT INTO `event`(id, url_id, title, description, date_created, owner_id) VALUES
(1, "GraciousSnarlingHorse", "First event", "An event to test the database",
    "2020-05-05 04:00:00", 1); /* 2020-05-05 12pm+8*/

INSERT INTO `event_timing`(event_id, start_dtime, end_dtime) VALUES
/* 12pm+8 to 4pm+8 on 6 May 2020 */
(1, "2020-05-06 04:00:00", "2020-05-06 08:00:00"),
/* 6pm+8 to 10pm+8 on 6 May 2020 */
(1, "2020-05-06 10:00:00", "2020-05-06 14:00:00"),
/* 12pm+8 to 4pm+8 on 7 May 2020 */
(1, "2020-05-07 04:00:00", "2020-05-06 08:00:00");

INSERT INTO `schedule`(event_id, user_id) VALUES
(1, 1),
(1, 2);

INSERT INTO `timing`(event_id, user_id, start_dtime, end_dtime) VALUES
/* Adam's timings */
/* 12pm+8 to 4pm+8 on 6 May 2020 */
(1, 1, "2020-05-06 04:00:00", "2020-05-06 08:00:00"),
/* 6pm+8 to 10pm+8 on 6 May 2020 */
(1, 1, "2020-05-06 10:00:00", "2020-05-06 14:00:00"),
/* 12pm+8 to 4pm+8 on 7 May 2020 */
(1, 1, "2020-05-07 04:00:00", "2020-05-06 08:00:00"),
/* Bran's timings */
/* 12pm+8 to 2pm+8 on 6 May 2020 */
(1, 2, "2020-05-06 04:00:00", "2020-05-06 06:00:00"),
/* 12pm+8 to 2pm+8 on 7 May 2020 */
(1, 2, "2020-05-07 04:00:00", "2020-05-07 06:00:00");

INSERT INTO `temp_user`(event_id, temp_name, password) VALUES
(1, "Cory", "$2b$10$mKNZc0.Z6mXsaSBaDAuxEeNSrRfVl0Vg6xCmFJ8hoJOHRxVbmxR6e");

INSERT INTO `temp_timing`(event_id, temp_name, start_dtime, end_dtime) VALUES
/* 6pm+8 to 8pm+8 on 6 May 2020 */
(1, "Cory", "2020-05-06 10:00:00", "2020-05-06 12:00:00");
