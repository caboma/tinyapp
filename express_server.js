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
app.use(express.static('public'));

const urlDatabase = { 
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "oc0619" },
  "sm5xK": { longURL: "http://www.google.com", userID: "oc1224"}
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

/* ---> Start of Helper functions */

//to generate new short URL
function generateShortURL() {
  const shortID = Math.random().toString(36).substring(2, 8);

  return shortID;
}

//returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id) => {
  const filteredURL = {};
  for (let shortURL in urlDatabase){
    if(urlDatabase[shortURL].userID === id){
      filteredURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredURL;
}

// Check user if already exists in users Database using Email
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

//Authenticate users by matching email and password in users database to user input
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
/* ---> End of Helper functions */



/* ---> Start of Viewing Pages 
  Rendering of pages only. All get functions
*/

//render root page
app.get("/", (req, res) => {
  const user_id = req.cookies['userId']
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  res.render("index", templateVars);
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

// Render Registration page
app.get("/register", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  res.render("register", templateVars);
});

//Render User Login Page
app.get("/login", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const templateVars = { user: userInfo };
  res.render("login", templateVars);
});

//list all URL in the database in a page
app.get("/urls", (req, res) => {
  const user_id = req.cookies['userId'];
  const userInfo = users[user_id];
  const filteredURL = urlsForUser(user_id);
  const templateVars = { urls: filteredURL, user: userInfo};
  res.render("urls_index", templateVars);
});

//Render Create New URL Page
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies['userId'];
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
  const user_id = req.cookies['userId'];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userInfo = users[user_id];
  const templateVars = {shortURL, longURL, user: userInfo };
  res.render("urls_show", templateVars);
});

//redirect to actual long URL website page 
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(200, longURL);
});

/* ---> End of Viewing Pages */


/* ---> Start of Functionalities. All get POST functions */

//Create new URL
app.post("/urls", (req, res) => {
  
  const randomKey = generateShortURL();
  const longURL = req.body.longURL;
  const userID = req.cookies['userId'];
  const newURL = { longURL, userID}
  urlDatabase[randomKey] = newURL;
  res.redirect(`urls/${randomKey}`);      
  
});

//UPDATE URL
app.post('/urls/:shortURL/', (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies['userId'];
  const longURL = req.body.longURL;
  // update the url from db
  const newURL = { longURL, userID}
  urlDatabase[shortURL] = newURL;
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
  res.redirect('/');
})

/* ---> END of Functionalities. All get POST functions */


// START SERVER
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});