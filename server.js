'use strict';
require('dotenv').config();
const express = require('express');
const app = express();
const superAgent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const db = new pg.Client(process.env.DATABASE_URL);
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');

const PORT = process.env.PORT;

// ======= Middleware =======
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('imgs'));
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(methodOverride('_method'));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(flash());

app.get('/', homePage);
app.get('/searches', newSearch);
app.post('/details', viewDetails);
app.post('/searches/results', searchResults);
app.post('/addToFavorite', addToFavorite);
app.post('/users/register', getUserData);
app.delete('/delete/:id', deleteBook);


// * ===        Register/Login/Dashboard       =====
app.get('/users/login', login);
app.get('/users/register', register);
app.get('/users/dashboard', dashboard);


// ! ===============================
// ! ===        Handlers       =====
// ! ===============================

function homePage(req, res) {
  const sql = 'SELECT * FROM books;';
  db.query(sql)
    .then(results => res.render('pages/index', { favoriteBooks: results.rows }))
    .catch(error => console.log(error));
}


function newSearch(req, res) {
  res.render('pages/searches/new');
}

function searchResults(req, res) {
  let url = `https://www.googleapis.com/books/v1/volumes?q=`;
  if (req.body.search[1] === 'title') { url += req.body.search[0] + '+intitle'; }
  if (req.body.search[1] === 'author') { url += req.body.search[0] + '+inauthor'; }
  console.log(url);
  console.log(req.body);
  superAgent.get(url).then(results => {
    const apiData = results.body.items;
    const refactoredResults = apiData.map(item => new BookRefactors(item));
    res.render('pages/show', { booksDetails: refactoredResults });
  }).catch(error => console.log(error));


}


function viewDetails(req, res) {
  res.render('pages/details', { bookDetails: req.body });
}

function addToFavorite(req, res) {
  const { image, isbn, title, authors, description } = req.body;
  const sql = 'INSERT INTO books (image,isbn,title,authors,description) VALUES($1,$2,$3,$4,$5);';
  const safeValues = [image, isbn, title, authors, description];

  db.query(sql, safeValues)
    .then(res.redirect('/'))
    .catch(error => console.log(error));
}

function deleteBook(req, res) {
  const sql = 'DELETE FROM books WHERE id=$1;';
  const { id } = req.params;
  const safeValue = [id];
  db.query(sql, safeValue)
    .then(() => res.redirect('/'))
    .catch(error => console.log(error));
}


function login(req, res) {
  res.render('login-reg/login');
}

function register(req, res) {
  res.render('login-reg/register');
}

function dashboard(req, res) {
  res.render('login-reg/dashboard');
}



function getUserData(req, res) {
  let { name, email, password, password2 } = req.body;
  console.log(req.body);

  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ message: 'Please enter all fields.' });
  }
  if (password.length < 6) {
    errors.push({ message: 'Password should be at least 6 characters' });
  }
  if (password !== password2) {
    errors.push({ message: 'Confirmed password do not match!' });
  }
  if (errors.length > 0) {
    res.render('login-reg/register', { errors });
  } else {
    //Form validation has passed

    const sqlSelectAll = 'SELECT * FROM users WHERE email = $1;';
    const sqlInsert = 'INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING id,password;';
    const safeValuesForInsert = [name, email, bcrypt.hash(password, 10)];
    const safeValueForSelect = [email];


    bcrypt.hash(password, 10)
      .then(results => {
        console.log(results);
        db.query(sqlSelectAll, safeValueForSelect, (err, DBResults) => {
          if (err) {
            throw err;
          }
          console.log(DBResults.rows);
          if (DBResults.rows.length > 0) {
            errors.push({ message: 'Email already registered!' });
            res.render('login-reg/register', { errors });
          } else {
            db.query(sqlInsert, safeValuesForInsert, (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash('success_msg', 'You are now registered. Please log in');
              res.redirect('/users/login');
            });
          }
        });
      });
  }
}
// ! ===============================
// !==== Constructor Functions =====
// ! ===============================

function joinAuthors(array) {
  return array.reduce((accumulator, currentValue) => accumulator + ', ' + currentValue);
}

class BookRefactors {

  constructor(data) {
    this.image = data.volumeInfo.imageLinks ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.isbn = data.volumeInfo.industryIdentifiers ? data.volumeInfo.industryIdentifiers[0].identifier : 'Not Available';
    this.title = data.volumeInfo.title ? data.volumeInfo.title : 'Not Available';
    this.authors = data.volumeInfo.authors ? joinAuthors(data.volumeInfo.authors) : 'Not Available';
    this.description = data.volumeInfo.description ? data.volumeInfo.description : 'Not Available';
  }

}

db.connect().then(() => {
  app.listen(PORT, () => `Listing to Port ${PORT}`);
  console.log('Connected to Database');
});

