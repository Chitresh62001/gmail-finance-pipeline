    CREATE TABLE transactions (
        id BIGSERIAL PRIMARY KEY,
        account TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        counterparty TEXT NOT NULL,
        intent TEXT NOT NULL,
        txn_date TIMESTAMP NOT NULL,
        CONSTRAINT unique_txn UNIQUE (amount, counterparty, txn_date)
    );