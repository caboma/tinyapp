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

const users = { 'oc0619': {
  userId: 'oc0619',
  userName: 'TM',
  email: 'tmtest@test.com',
  password: '1234'
}, 'oc1224': {
  userId: 'oc1224',
  userName: 'Omar Cabatbat',
  email: 'caboma@test.com',
  password: 'test'
}};

//helper functions
const findUserByEmail = (email) => {
  // loop and try to match the email
  for (let userId in users) {
    const userObj = users[userId];

    if (userObj.email === email) {
      // if found return the user
      return userObj;
    }
  }
  // if not found return false
  return false;
};

const authenticateUser = (email, password) => {
  const userFound = findUserByEmail(email);
  if (userFound && userFound.password === password) {
    // user is authenticated
    return userFound;
  }
  return false;
};
//Create random Id for the new user
const createRandomId = () => {
  const id = Math.random().toString(36).substring(2, 8);
  return id;
}

//add new user obeject to users database
const addNewUser = (userName, email, password) => {

  // generate a random id
  const userId = createRandomId();

  const newUser = {
    userId,
    userName,
    email,
    password,
  };

  // add the new user to users db
  users[userId] = newUser;
  return userId; // return the id => add it to cookie later
}

//root
app.get("/", (req, res) => {
  const userInfo = req.cookies['userId']
  const templateVars = { urls: urlDatabase, user: userInfo };

  res.render("urls_index", templateVars);
});

//show database content
app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);
});
//show usercontent
app.get("/users.json", (req, res) => {

  res.json(users);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//USER LOGIN AND REGISTRATION PROCESS
//User Registration
app.post('/register', (req, res) => {
  // extract the info from the form with req.body
  const {username, email, password} = req.body;

  // check if the user by email if does not already exists

  const userFound = findUserByEmail(email);

  if (!userFound) {
    const userId = addNewUser(username, email, password);
    // setCookie
    res.cookie('userId', userId);
    res.redirect('/urls');
  } else {
    res.status(404).send('The user already exists!');
  }
});


app.get("/register", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  res.render("register", templateVars);
});

//View User Login Page
app.get("/login", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  res.render("login", templateVars);
});

//User Login 
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  // check if the email and password exists in the database
  const userFound = authenticateUser(email, password);

  if (userFound) {
    // setCookie
    res.cookie('userId', userFound.userId);
    res.redirect('/urls');
  } else {
    res.status(403).send('The user cannot be found!');
  }
  
});

//User Logout, removes cookies
app.post('/logout', (req, res) => {
  res.clearCookie('userId');
  res.redirect('/login');
})



//list all URL in the database in a page
app.get("/urls", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = { urls: urlDatabase, user: userInfo};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  res.render("urls_new", templateVars);
});

//show individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = {shortURL, longURL, user: userInfo };
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