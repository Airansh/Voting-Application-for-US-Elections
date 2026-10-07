-- Demo data. Every demo account uses the password: Password@123
-- Usage: mysql -u <user> -p votinginfo < database/seed.sql

USE votinginfo;

INSERT INTO voters (email_id, first_name, last_name, address, city, zipcode, age, driving_license, status) VALUES
    ('admin@example.com',   'Ada',     'Admin',       '410 E Washington St', 'Iowa City', '52240', 40, 'DMV10000', 'approved'),
    ('manager@example.com', 'Morgan',  'Manager',     '410 E Washington St', 'Iowa City', '52240', 38, 'DMV10001', 'approved'),
    ('alec@example.com',    'Alec',    'Voter',       '103 S Capitol St',    'Iowa City', '52240', 22, 'DMV10002', 'approved'),
    ('joseph@example.com',  'Joseph',  'Voter',       '103 S Capitol St',    'Iowa City', '52242', 21, 'DMV10003', 'approved'),
    ('vedansh@example.com', 'Vedansh', 'Voter',       '103 S Capitol St',    'Iowa City', '52240', 24, 'DMV10004', 'approved'),
    ('pending1@example.com','Jamie',   'Applicant',   '12 Burlington St',    'Iowa City', '52240', 30, 'DMV10005', 'pending'),
    ('pending2@example.com','Riley',   'Applicant',   '88 Gilbert Ct',       'Iowa City', '52242', 19, 'DMV10006', 'pending');

INSERT INTO users (voter_id, password, role, email_id) VALUES
    ('voterid1', 'scrypt$07478d970253ee3c1ab8fcd77d1b46ca$41f0099e513675f1bcb8afa9f7213f3c6dc63ea7674ae95206bd24929a42c9c9e5b7151b8a705607e197639d9c30102ae87f493b3c902ef8319467ff0e1486de', 'voter',   'alec@example.com'),
    ('voterid2', 'scrypt$07478d970253ee3c1ab8fcd77d1b46ca$41f0099e513675f1bcb8afa9f7213f3c6dc63ea7674ae95206bd24929a42c9c9e5b7151b8a705607e197639d9c30102ae87f493b3c902ef8319467ff0e1486de', 'voter',   'joseph@example.com'),
    ('voterid3', 'scrypt$07478d970253ee3c1ab8fcd77d1b46ca$41f0099e513675f1bcb8afa9f7213f3c6dc63ea7674ae95206bd24929a42c9c9e5b7151b8a705607e197639d9c30102ae87f493b3c902ef8319467ff0e1486de', 'voter',   'vedansh@example.com'),
    ('voterid4', 'scrypt$07478d970253ee3c1ab8fcd77d1b46ca$41f0099e513675f1bcb8afa9f7213f3c6dc63ea7674ae95206bd24929a42c9c9e5b7151b8a705607e197639d9c30102ae87f493b3c902ef8319467ff0e1486de', 'admin',   'admin@example.com'),
    ('voterid5', 'scrypt$07478d970253ee3c1ab8fcd77d1b46ca$41f0099e513675f1bcb8afa9f7213f3c6dc63ea7674ae95206bd24929a42c9c9e5b7151b8a705607e197639d9c30102ae87f493b3c902ef8319467ff0e1486de', 'manager', 'manager@example.com');

INSERT INTO precinct (zipcode, last_4_Digits, voting_location, polling_manager, state_election_contact) VALUES
    ('52240', '1234', '630 S Capitol St, Iowa City', 'voterid5', 'elections@example.com'),
    ('52242', '1000', '100 Old Capitol, Iowa City',  'voterid5', 'elections@example.com');

INSERT INTO races (race_title, candidates, zipcode) VALUES
    ('Mayor of Iowa City', '[{"name": "Candidate 1", "party": "Party A"}, {"name": "Candidate 2", "party": "Party B"}, {"name": "Candidate 3", "party": "Party C"}]', '52240'),
    ('City Council District B', '[{"name": "Candidate 4", "party": "Party A"}, {"name": "Candidate 5", "party": "Party B"}]', '52242');

INSERT INTO elections (title, Race, Start_Time, End_Time) VALUES
    ('Iowa City Mayoral Election', 'Mayor of Iowa City',      '2024-01-01 00:00:00', '2035-12-31 23:59:00'),
    ('District B Council Election', 'City Council District B', '2024-01-01 00:00:00', '2035-12-31 23:59:00');
