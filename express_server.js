const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
// Testing only 
if(process.argv[0] && process.argv[0] === "dev"){
  const morgan = require('morgan');
}

// Port number
const PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "sm5xK": "http://www.google.com"
};
//root
app.get("/", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies['username'] };

  res.render("urls_index", templateVars);
});

//show database content
app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
//User Login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
})

//User Logout, removes cookies
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})

//list all URL in the database in a page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies['username'] };
  res.render("urls_new", templateVars);
});

//show individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]
  const templateVars = {shortURL, longURL, username: req.cookies['username']};
  res.render("urls_show", templateVars);
});

//to generate new short URL
function generateRandomString() {
  const shortID = Math.random().toString(36).substring(2, 8);

  return shortID;
}

//Create new URL
app.post("/urls", (req, res) => {
  const randomKey = generateRandomString();
  const longURL = `${req.body.longURL}`;
  urlDatabase[randomKey] = longURL;
  res.redirect(`urls/${randomKey}`);         
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(200, longURL);
});

//UPDATE URL
app.post('/urls/:shortURL/', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  // delete the url from db
    urlDatabase[shortURL] = longURL;
  // redirect
    res.redirect('/urls');
  })

  //Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
const shortURL = req.params.shortURL;
// delete the url from db
  delete urlDatabase[shortURL];
// redirect
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});