const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require('morgan');
//const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Port number
const PORT = 8080; // default port 8080

//requiring functions from helper module
const { generateShortURL, 
        findURL, 
        findUserByEmail, 
        authenticateUser, 
        addNewUser 
      } = require('./helpers');

// setting all required dependencies to be used by the app.
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(morgan('short'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);

//-----URL Database---------
const urlDatabase = {};

//-----Users Database-------
const users = {};

/* ---> Start of Viewing Pages 
  Rendering of pages only. All GET functionality
*/

//render root page
app.get("/", (req, res) => {
  const user_id = req.session['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };

  if (user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login")
  }
});

// Render Registration page
app.get("/register", (req, res) => {
  const user_id = req.session['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };

  if (user_id) {
    res.redirect("/urls");
  } else {
    res.render("register", templateVars);
  }
});

//Render User Login Page
app.get("/login", (req, res) => {
  const user_id = req.session['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  
  if (user_id) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

//list all URL in the database in a page
app.get("/urls", (req, res) => {
  const user_id = req.session['userId'];
  const userInfo = users[user_id];
  const filteredURL = {};
  
  // creates new object url owned by the user
  for (let shortURL in urlDatabase){
    if(urlDatabase[shortURL].userID === user_id){
      filteredURL[shortURL] = urlDatabase[shortURL];
    }
  }

  const templateVars = { urls: filteredURL, user: userInfo};
  res.render("urls_index", templateVars);
});

//Render Create New URL Page
app.get("/urls/new", (req, res) => {
  const user_id = req.session['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  
  //check if user is logged in or not
  if (user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

//show individual URL details
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const foundURL = findURL(shortURL, urlDatabase);
  const user_id = req.session['userId'];
  
  //check if user is logged in or not
  if (user_id) {
    //check if the url exist in the database or not
    if(foundURL){
      const longURL = urlDatabase[shortURL].longURL;
      const templateVars = {shortURL, longURL, user: users[user_id]};
      const urlUserId = urlDatabase[shortURL].userID;
      // check if the user owns the url or not
      if(user_id === urlUserId){
        res.render("urls_show", templateVars);
      } else {
        res.render('error', { 
          errorMsg: 'Warning: You do not have access to access this URL. Please login.', user: users[user_id] 
        });
      }
    } else {
      res.render('error', { 
        errorMsg: 'Warning: The URL cannot be found!', user: users[user_id]
      });
    }
  } else {
    res.render('error', { 
      errorMsg: 'Warning: You do not have access to view this URL. Please LOGIN.', user: ''
    });
  }
});

//redirect to actual long URL website page 
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const foundURL = findURL(shortURL, urlDatabase)
  if(foundURL){
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL)
  }
  else {
    res.render('error', { errorMsg: 'Warning: The URL cannot be found!', user: '' })
  }
});
/* ---> End of Viewing Pages */

/* ---> Start of Functionalities. All POST functionalities */

//Create new URL
app.post("/urls", (req, res) => {
  const randomKey = generateShortURL();
  const longURL = req.body.longURL;
  const userID = req.session['userId'];
  const newURL = { longURL, userID}
  urlDatabase[randomKey] = newURL;
  
  //check if user is logged in or not
  if (userID) {
    res.redirect(`urls/${randomKey}`);
  }
  else {
    res.render('error', { errorMsg: 'Warning: You do not have access to add new URL. Please LOGIN.', user: '' })
  }
});

//UPDATE URL
app.post('/urls/:shortURL/', (req, res) => {
  const userID = req.session['userId'];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const urlUserId = urlDatabase[shortURL].userID;
  
  //check user if logged in or not
  if (userID) {
    //check if the logged in user id own the url
    if(userID === urlUserId){
      // update the url from db
      const newURL = { longURL, userID }
      urlDatabase[shortURL] = newURL;
      // redirect
      res.redirect('/urls');
    } else {
      res.render('error', { 
        errorMsg: 'Warning: You do not own and have no permission to update this url!', user: userID 
      });
    }
  } else {
    res.render('error', {
      errorMsg: 'Warning: You do not have access to update this URL. Please LOGIN.', user: '' 
    });
  }
})

  //Delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.session['userId'];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const urlUserId = urlDatabase[shortURL].userID;
  
  //check if the user is logged in or not
  if (userID) {
    //check if the logged in user id own the url
    if(userID === urlUserId){
      // delete the url from db
      delete urlDatabase[shortURL];
      // redirect
      res.redirect('/urls');
    } else {
      res.render('error', { 
        errorMsg: 'Warning: You do not own and have no permission to delete this url!', user: '' 
      });
    }
  } else {
    res.render('error', { 
      errorMsg: 'Warning: You do not have access to delete this URL. Please LOGIN.', user: '' 
    });
  }
})

//User Registration
app.post('/register', (req, res) => {
  // extract the info from the form with req.body
  const { username, email, password } = req.body;

  // check if the user by email if does not already exists
  const userFound = findUserByEmail(email, users, users);

  if (!userFound) {
    const userId = addNewUser(username, email, password, users);
    // setCookie
    req.session['userId'] = userId;
    res.redirect('/urls');
  } else {
    res.render('error', { 
      errorMsg: 'Error (404): The user already exists!', user: '' 
    });
  }
});

//User Login 
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  // check if the email and password exists in the database
  const userFound = authenticateUser(email, password,users);

  if (userFound) {
    // setCookie
    req.session['userId'] = userFound.userId;
    res.redirect('/urls');
  } else {
    res.render('error', { 
      errorMsg: 'Warning: User cannot be found!', user: '' 
    });
  }
});

//User Logout, removes cookies
app.post('/logout', (req, res) => {
  req.session['userId'] = null;
  res.redirect('/urls');
})
/* ---> END of Functionalities. All get POST functions */

// START SERVER
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});