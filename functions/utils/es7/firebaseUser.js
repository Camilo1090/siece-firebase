'use strict';

const admin = require('firebase-admin');
const db = admin.firestore();
const cookieParser = require('cookie-parser')();

// Express middleware that checks if a Firebase ID Tokens is passed in the `Authorization` HTTP
// header or the `__session` cookie and decodes it.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// When decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  try {
    const idToken = await getIdTokenFromRequest(req, res);
    if (idToken)
      return addDecodedIdTokenToRequest(idToken, req, next);
    else
      return next();
  } catch(error) {
    console.log(error);
    return next();
  }
};

/**
 * Returns a Promise with the Firebase ID Token if found in the Authorization or the __session cookie.
 */
const getIdTokenFromRequest = (req, res) => {
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
};

/**
 * Returns a Promise with the Decoded ID Token and adds it to req.user.
 */
const addDecodedIdTokenToRequest = async (idToken, req, next) => {
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    console.log('ID Token correctly decoded for: ', decodedIdToken.uid);
    const userRecord = await admin.auth().getUser(decodedIdToken.uid);
    console.log('Successfully got user: ', userRecord.uid);
    req.user = userRecord;
    const usersSnapshot = await db.collection('users')
      .where('user_id', '==', userRecord.uid)
      .get();
    if (usersSnapshot.size === 1 && usersSnapshot.docs[0].data().is_admin) {
      req.is_admin = true;
      console.log('Admin user request');
    }
    return next();
  } catch(error) {
    console.error('Error while verifying Firebase ID token:', error);
    return next();
  }
};

exports.validateFirebaseIdToken = validateFirebaseIdToken;