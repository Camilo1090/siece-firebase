'use strict';var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}const admin = require('firebase-admin');

exports.login = (() => {var _ref = (0, _asyncToGenerator3.default)(function* (req, res) {
    const formData = req.body;
    const data = {};
    // Get the ID token passed and the CSRF token.
    const idToken = formData.idToken;
    // const csrfToken = formData.csrfToken;
    // Guard against CSRF attacks.
    // if (csrfToken !== req.cookies.csrfToken) {
    //   res.status(401).send('UNAUTHORIZED REQUEST!');
    //   return;
    // }
    // Set session expiration to 1 hour.
    const expiresIn = 60 * 60 * 1000;
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // To only allow session cookie setting on recent sign-in, auth_time in ID token
    // can be checked to ensure user was recently signed in before creating a session cookie.
    try {
      const sessionCookie = yield admin.auth().createSessionCookie(idToken, { expiresIn });
      // Set cookie policy for session cookie.
      const options = { maxAge: expiresIn, httpOnly: false, secure: false, path: '/' };
      res.cookie('__session', sessionCookie, options);
      // console.log('cookie: ', res.cookie);
      // const decodedIdToken = await admin.auth().verifySessionCookie(sessionCookie, true);
      // data.user = await admin.auth().getUser(decodedIdToken.uid);
      // return res.render('index', data);
      // console.log(res.getHeader('set-cookie'));
      return res.status(200).send(res.getHeader('set-cookie'));
      // return res.end(JSON.stringify({status: 'success'}));
    } catch (error) {
      console.log('Error: ', error);
      data.error = 'Error al iniciar sesión.';
      return res.render('login', data);
    }
  });return function (_x, _x2) {return _ref.apply(this, arguments);};})();

exports.logout = (req, res) => {
  res.clearCookie('__session');
  res.redirect('/index');
};