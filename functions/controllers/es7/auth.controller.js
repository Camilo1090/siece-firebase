const admin = require('firebase-admin');

exports.login = async (req, res) => {
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
    const sessionCookie = await admin.auth().createSessionCookie(idToken, {expiresIn});
    // Set cookie policy for session cookie.
    const options = {maxAge: expiresIn, httpOnly: false, secure: false};
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
};

exports.logout = (req, res) => {
  res.clearCookie('__session');
  res.redirect('/index');
};