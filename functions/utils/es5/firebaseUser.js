'use strict';var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const admin = require('firebase-admin');
const db = admin.firestore();
const cookieParser = require('cookie-parser')();

// Express middleware that checks if a Firebase ID Tokens is passed in the `Authorization` HTTP
// header or the `__session` cookie and decodes it.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// When decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = (() => {var _ref = (0, _asyncToGenerator3.default)(function* (req, res, next) {
    console.log('Check if request is authorized with Firebase ID token');

    try {
      const idToken = yield getIdTokenFromRequest(req, res);
      if (idToken)
      return addDecodedIdTokenToRequest(idToken, req, next);
      // return validateFirebaseSessionCookie()
      else
        return next();
    } catch (error) {
      console.log(error);
      return next();
    }
  });return function validateFirebaseIdToken(_x, _x2, _x3) {return _ref.apply(this, arguments);};})();

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
const addDecodedIdTokenToRequest = (() => {var _ref2 = (0, _asyncToGenerator3.default)(function* (idToken, req, next) {
    try {
      const decodedIdToken = yield admin.auth().verifyIdToken(idToken);
      console.log('ID Token correctly decoded for: ', decodedIdToken.uid);
      const userRecord = yield admin.auth().getUser(decodedIdToken.uid);
      console.log('Successfully got user: ', userRecord.uid);
      req.user = userRecord;
      const usersSnapshot = yield db.collection('users').
      where('user_id', '==', userRecord.uid).
      get();
      if (usersSnapshot.size === 1 && usersSnapshot.docs[0].data().is_admin) {
        req.is_admin = true;
        console.log('Admin user request');
      }
      return next();
    } catch (error) {
      console.error('Error while verifying Firebase ID token:', error);
      return next();
    }
  });return function addDecodedIdTokenToRequest(_x4, _x5, _x6) {return _ref2.apply(this, arguments);};})();

const validateFirebaseSessionCookie = (() => {var _ref3 = (0, _asyncToGenerator3.default)(function* (req, res, next) {
    const sessionCookie = req.cookies.__session;
    // Verify the session cookie. In this case an additional check is added to detect
    // if the user's Firebase session was revoked, user deleted/disabled, etc.
    if (sessionCookie) {
      console.log('Found "__session" cookie');
      try {
        const decodedIdToken = yield admin.auth().verifySessionCookie(sessionCookie, true /** checkRevoked */);
        console.log('ID Token correctly decoded for: ', decodedIdToken.uid);
        const userRecord = yield admin.auth().getUser(decodedIdToken.uid);
        console.log('Successfully got user: ', userRecord.uid);
        req.user = userRecord;
        const usersSnapshot = yield db.collection('users').
        where('user_id', '==', userRecord.uid).
        get();
        if (usersSnapshot.size === 1 && usersSnapshot.docs[0].data().is_admin) {
          req.is_admin = true;
          console.log('Admin user request');
        }
        return next();
      } catch (error) {
        console.error('Error while verifying Firebase Session Cookie:', error);
        return next();
      }
    }

    console.log('Session Cookie not found, proceeding...');
    return next();
  });return function validateFirebaseSessionCookie(_x7, _x8, _x9) {return _ref3.apply(this, arguments);};})();

exports.validateFirebaseIdToken = validateFirebaseIdToken;
exports.validateFirebaseSessionCookie = validateFirebaseSessionCookie;