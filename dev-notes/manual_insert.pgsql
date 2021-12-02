DO $$
DECLARE v_acct_id BIGINT;
DECLARE v_change_id BIGINT;
BEGIN
v_acct_id = 1;

INSERT INTO account_change
(account_id)
VALUES
(v_acct_id)
RETURNING change_id INTO v_change_id;

UPDATE account
SET name = 'myChange2',
    last_modified = NOW(),
    last_change_id = v_change_id
WHERE acct_id = v_acct_id;
END $$;

SELECT *
FROM account;

SELECT *
FROM account_change;
