CREATE DATABASE IF NOT EXISTS webster;
GRANT ALL PRIVILEGES ON webster.* TO 'scheban'@'localhost';
FLUSH PRIVILEGES;

USE webster;

CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar VARCHAR(255), 
    confirmed BOOLEAN DEFAULT FALSE,
    2fa_active BOOLEAN DEFAULT FALSE,
    2fa_key VARCHAR(255),
    confirm_token VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS images (
    image_id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATETIME,
    name TEXT NOT NULL,
    PRIMARY KEY(image_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS fonts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
);