const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "sm5xK": "http://www.google.com"
};
const morgan = require('morgan');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]
  const templateVars = { shortURL, longURL};
  res.render("urls_show", templateVars);
});

function generateRandomString() {
  const shortID = Math.random().toString(36).substring(2, 8);

  return shortID;
}

//Create new URL
app.post("/urls", (req, res) => {
  const randomKey = generateRandomString();
  const longURL = `http://${req.body.longURL}`;
  urlDatabase[randomKey] = longURL;
  res.redirect(`urls/${randomKey}`);         
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(200, longURL);
});

//Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  //const shortURL = req.params.shortURL;
// delete the url from db
  delete urlDatabase[req.params.shortURL];
// redirect
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});