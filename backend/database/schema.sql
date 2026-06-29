-- Drop existing tables (development only)
/*
DROP TABLE IF EXISTS verification_documents CASCADE;
DROP TABLE IF EXISTS veterans CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ===========================
-- USERS
-- ===========================

CREATE TABLE users (

    id SERIAL PRIMARY KEY,

    email VARCHAR(100) UNIQUE NOT NULL,

    password VARCHAR(255) NOT NULL,

    role VARCHAR(20) DEFAULT 'veteran',

    account_status VARCHAR(20) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ===========================
-- VETERANS
-- ===========================

CREATE TABLE veterans (

    id SERIAL PRIMARY KEY,

    user_id INT UNIQUE NOT NULL,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100) NOT NULL,

    gender VARCHAR(10) NOT NULL,

    date_of_birth DATE NOT NULL,

    national_id VARCHAR(20) UNIQUE NOT NULL,

    phone VARCHAR(20) NOT NULL,

    service_number VARCHAR(50) UNIQUE NOT NULL,

    service_branch VARCHAR(100) NOT NULL,

    rank VARCHAR(100) NOT NULL,

    years_served INT NOT NULL,

    verification_status VARCHAR(20)
    DEFAULT 'Pending',

    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE

);


-- ===========================
-- DOCUMENTS
-- ===========================

CREATE TABLE verification_documents (

    id SERIAL PRIMARY KEY,

    veteran_id INT NOT NULL,

    document_type VARCHAR(50) NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    verification_status VARCHAR(20)
    DEFAULT 'Pending',

    uploaded_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (veteran_id)
    REFERENCES veterans(id)
    ON DELETE CASCADE

);

*/




-- Drop existing tables (development only)
DROP TABLE IF EXISTS verification_documents CASCADE;
DROP TABLE IF EXISTS veterans CASCADE;
DROP TABLE IF EXISTS users CASCADE;


-- ===========================
-- USERS
-- ===========================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'veteran',
    account_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ===========================
-- VETERANS
-- ===========================

CREATE TABLE veterans (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    date_of_birth DATE NOT NULL,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    service_number VARCHAR(50) UNIQUE NOT NULL,
    service_branch VARCHAR(100) NOT NULL,
    rank VARCHAR(100) NOT NULL,
    years_served INT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ===========================
-- DOCUMENTS
-- ===========================

CREATE TABLE verification_documents (
    id SERIAL PRIMARY KEY,
    veteran_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'Pending',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (veteran_id) REFERENCES veterans(id) ON DELETE CASCADE
);
