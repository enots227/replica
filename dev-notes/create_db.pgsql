-- postgres1
CREATE DATABASE source;

CREATE TABLE account(
    acct_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    last_change_id BIGINT NOT NULL,
    last_modified TIMESTAMP NOT NULL DEFAULT NOW()
);

-- DROP TABLE account;

CREATE TABLE account_change(
    change_id SERIAL PRIMARY KEY,
    account_id INT,
    changed_on TIMESTAMP NOT NULL DEFAULT NOW()
);
-- DROP TABLE account_change;

-- postgres2
CREATE DATABASE sink;

-- postgres3
CREATE DATABASE sink;