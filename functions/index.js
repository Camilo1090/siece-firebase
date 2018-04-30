const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
// let db = admin.firestore();

const express = require('express');
// const engines = require('consolidate');
const exphbs = require('express-handlebars');

const routes = require('./routes');
const firebaseUser = require('./firebaseUser');

const app = express();

// app.engine('hbs', engines.handlebars);
app.engine('hbs', exphbs({ defaultLayout: 'main' }));
app.set('views', './views');
app.set('view engine', 'hbs');

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

routes(app, firebaseUser.validateFirebaseIdToken);
// app.use(firebaseUser.validateFirebaseIdToken);



exports.app = functions.https.onRequest(app);
