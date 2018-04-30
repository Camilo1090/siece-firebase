'use strict';

const admin = require('firebase-admin');
const cookieParser = require('cookie-parser')();

// Express middleware that checks if a Firebase ID Tokens is passed in the `Authorization` HTTP
// header or the `__session` cookie and decodes it.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// When decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  return getIdTokenFromRequest(req, res).then(idToken => {
    if (idToken)
      return addDecodedIdTokenToRequest(idToken, req, next);
    else
      return next();
  }).catch(err => {
    console.log(err);
    return next();
  });
};

/**
 * Returns a Promise with the Firebase ID Token if found in the Authorization or the __session cookie.
 */
function getIdTokenFromRequest(req, res) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    return Promise.resolve(req.headers.authorization.split('Bearer ')[1]);
  }
  return new Promise((resolve, reject) => {
    cookieParser(req, res, () => {
      if (req.cookies && req.cookies.__session) {
        console.log('Found "__session" cookie');
        // Read the ID Token from cookie.
        resolve(req.cookies.__session);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Returns a Promise with the Decoded ID Token and adds it to req.user.
 */
function addDecodedIdTokenToRequest(idToken, req, next) {
  return admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    return admin.auth().getUser(decodedIdToken.uid).then(userRecord => {
      req.user = userRecord;
      console.log('ID Token correctly decoded', userRecord);
      return next();
    }).catch(error => {
      console.error('Error getting user after verifying ID token:', error);
      return next();
    });
  }).catch(error => {
    console.error('Error while verifying Firebase ID token:', error);
    return next();
  });
}

exports.validateFirebaseIdToken = validateFirebaseIdToken;