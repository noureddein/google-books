DROP TABLE IF EXISTS books;
CREATE TABLE IF NOT EXISTS books(
  id SERIAL PRIMARY KEY NOT NULL,
  image TEXT NOT NULL,
  isbn VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  authors VARCHAR NOT NULL,
  description VARCHAR NOT NULL
);

INSERT INTO books (title, authors, isbn, image, description) VALUES (
  'Dune',
  'Frank Herbert',
  'ISBN_13 9780441013593',
  'http://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=5&edge=curl&source=gbs_api',
  'Follows the adventures of Paul Atreides, '
);