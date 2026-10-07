-- Schema for the voting application. Works on MySQL 8+ and MariaDB 10.5+.
-- Usage: mysql -u <user> -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS votinginfo CHARACTER SET utf8mb4;
USE votinginfo;

DROP TABLE IF EXISTS voter_history;
DROP TABLE IF EXISTS elections;
DROP TABLE IF EXISTS races;
DROP TABLE IF EXISTS precinct;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS voters;

-- Registration requests. status is one of: pending, approved, denied.
CREATE TABLE voters (
    email_id        VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    city            VARCHAR(255) NOT NULL,
    zipcode         VARCHAR(10)  NOT NULL,
    age             INT          NOT NULL,
    driving_license VARCHAR(100) NOT NULL,
    status          VARCHAR(45)  NOT NULL DEFAULT 'pending',
    PRIMARY KEY (email_id),
    KEY voters_status_idx (status),
    KEY voters_zipcode_idx (zipcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Login accounts. role is one of: voter, admin, manager.
-- password holds an scrypt hash; reset_token holds the SHA-256 of a one-time
-- "create / reset password" token that is e-mailed to the user.
CREATE TABLE users (
    voter_id      VARCHAR(150) NOT NULL,
    password      VARCHAR(255) DEFAULT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'voter',
    email_id      VARCHAR(255) NOT NULL,
    reset_token   CHAR(64)     DEFAULT NULL,
    reset_expires DATETIME     DEFAULT NULL,
    PRIMARY KEY (voter_id),
    UNIQUE KEY users_email_unique (email_id),
    KEY users_reset_token_idx (reset_token),
    CONSTRAINT users_email_fk FOREIGN KEY (email_id) REFERENCES voters (email_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE precinct (
    zipcode                VARCHAR(10)  NOT NULL,
    last_4_Digits          VARCHAR(4)   NOT NULL,
    voting_location        VARCHAR(255) NOT NULL,
    polling_manager        VARCHAR(150) NOT NULL,
    state_election_contact VARCHAR(255) NOT NULL,
    PRIMARY KEY (zipcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- candidates is a JSON array of {"name": ..., "party": ...} objects.
CREATE TABLE races (
    race_title VARCHAR(150) NOT NULL,
    candidates JSON         DEFAULT NULL,
    zipcode    VARCHAR(10)  NOT NULL,
    PRIMARY KEY (race_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- status is 'open' unless an administrator closed the election early; whether
-- an open election is upcoming, active or ended is derived from its times.
CREATE TABLE elections (
    title      VARCHAR(255) NOT NULL,
    Race       VARCHAR(150) NOT NULL,
    Start_Time DATETIME     NOT NULL,
    End_Time   DATETIME     NOT NULL,
    status     VARCHAR(45)  NOT NULL DEFAULT 'open',
    PRIMARY KEY (title),
    CONSTRAINT elections_race_fk FOREIGN KEY (Race) REFERENCES races (race_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per voter; CandidatesVoted is a JSON array of
-- {"race", "name", "party", "votedAt"} objects, at most one per race.
CREATE TABLE voter_history (
    voter_id        VARCHAR(150) NOT NULL,
    CandidatesVoted JSON         DEFAULT NULL,
    PRIMARY KEY (voter_id),
    CONSTRAINT voter_history_user_fk FOREIGN KEY (voter_id) REFERENCES users (voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
