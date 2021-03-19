const bcrypt = require('bcrypt');
const saltRounds = 10;
/* ---> Start of Helper functions */

//to generate new short URL
function generateShortURL() {
  const shortID = Math.random().toString(36).substring(2, 8);

  return shortID;
}

//check url if already exist in the database
const findURL = (url, urlDatabase) => {
  for (let shortURL in urlDatabase){
    if(shortURL === url) {
      return true;
    }
  }
  return false;
}

// Check user if already exists in users Database using Email
const findUserByEmail = (email, userDb) => {
  // loop and try to match the email
  for (let userId in userDb) {
    const userObj = userDb[userId];

    if (userObj.email === email) {
      // if found return the user
      return userObj;
    }
  }
  // if not found return false
  return undefined;
};

//Authenticate users by matching email and password in users database to user input
const authenticateUser = (email, password, userDb) => {
  const userFound = findUserByEmail(email, userDb);
  if (userFound && bcrypt.compareSync(password, userFound.password)) {
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
const addNewUser = (userName, email, password, users) => {

  // generate a random id
  const userId = createRandomId();

  const newUser = {
    userId,
    userName,
    email,
    password : bcrypt.hashSync(password, saltRounds),
  };

  // add the new user to users db
  users[userId] = newUser;
  return userId; // return the id => add it to cookie later
}
/* ---> End of Helper functions */

module.exports = { generateShortURL, findURL, findUserByEmail, authenticateUser, addNewUser };