const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
// let db = admin.firestore();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
// const session = require('express-session');
// const engines = require('consolidate');
// const flash = require('express-flash');
const exphbs = require('express-handlebars');

const routes = require('./routes');

const app = express();
app.use(cors({
  credentials: true
}));
app.use(cookieParser());

// let sessionStore = new session.MemoryStore;

// app.engine('hbs', engines.handlebars);
app.engine('hbs', exphbs({ defaultLayout: 'main' }));
app.set('views', './views');
app.set('view engine', 'hbs');
// app.use(session({
//   cookie: { maxAge: 60000 },
//   store: sessionStore,
//   saveUninitialized: true,
//   resave: 'true',
//   secret: 'secret'
// }));
// app.use(flash());
// Custom flash middleware -- from Ethan Brown's book, 'Web Development with Node & Express'
// app.use(function(req, res, next){
//   // if there's a flash message in the session request, make it available in the response, then delete it
//   console.log(req.session.sessionFlash);
//   res.locals.sessionFlash = req.session.sessionFlash;
//   delete req.session.sessionFlash;
//   next();
// });

// app.get('/', (request, response) => {
//   response.send(`${Date.now()}`);
// });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions


// app.get('/', (req, res) => {
//   // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
//   if (req.user)
//     return res.redirect('dashboard');
//   else
//     return res.render('user');
// });

routes(app);
// app.use(firebaseUser.validateFirebaseIdToken);



exports.app = functions.https.onRequest(app);
