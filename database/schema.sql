CREATE DATABASE IF NOT EXISTS smart_gym CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_gym;

-- 1. Staff table (Hashed passwords, role-based security - SCRUM-14)
CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers table (SCRUM-3)
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(150) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active Inside',
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP NULL
);

-- 4. Payments table (Sprint 1 $2 walk-in fee)
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  recorded_by VARCHAR(100) DEFAULT 'Staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
