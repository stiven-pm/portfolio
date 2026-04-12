CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    password VARCHAR(255),
    role VARCHAR(255),
    job_title VARCHAR(255),
    is_leader BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS designers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users (id),
    created INTEGER,
    edited INTEGER
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users (id),
    requested INTEGER,
    effective INTEGER
);

CREATE TABLE IF NOT EXISTS quoters (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users (id),
    quoted INTEGER,
    projects INTEGER,
    products INTEGER
);

CREATE TABLE IF NOT EXISTS processed_events (
    event_id UUID PRIMARY KEY,
    processed_at VARCHAR(255)
);
