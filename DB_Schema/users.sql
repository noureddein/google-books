DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users(
  id BIGSERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(200) NOT NULL,
  password VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  UNIQUE (email)
);

INSERT INTO users (name,password,email) VALUES('noureddein','1234567','nour@gmail.com');