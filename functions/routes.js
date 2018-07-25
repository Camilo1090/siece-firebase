const admin = require('firebase-admin');
const db = admin.firestore();
db.settings({
  timestampsInSnapshots: true
});
// const router = express.Router();

// let dir = 'es7';
// if (process.env['NODE_ENV'] === 'production')
//   dir = 'es5';

const firebaseUser = require('./utils/es7/firebaseUser');

const authController = require('./controllers/es7/auth.controller');
const indexController = require('./controllers/es7/index.controller');
const formController = require('./controllers/es7/form.controller');
const profileController = require('./controllers/es7/profile.controller');
const indicatorsController = require('./controllers/es7/indicators.controller');
const adminController = require('./controllers/es7/admin.controller');


module.exports = (app) => {
  // app.use(firebaseUser.validateFirebaseIdToken);
  app.use(firebaseUser.validateFirebaseSessionCookie);

  app.get('/', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.render('landing');
  });

  app.get('/login', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return res.redirect('/index');
    else
      return res.render('login');
  });

  app.post('/login', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return res.redirect('/index');
    else
      return authController.login(req, res);
      // return res.render('login');
  });

  app.get('/logout', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return authController.logout(req, res);
    else
      return res.redirect('/index');
    // return res.render('login');
  });

  app.get('/index', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    let data = {};
    if (req.user)
      data.user = req.user;
    return indexController.getIndex(req, res);
  });

  app.get('/perfil', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return res.redirect('/index');
      else
        return profileController.getProfile(req, res);
    else
      return res.redirect('/login');
  });

  app.post('/perfil', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return res.redirect('/index');
      else
        return profileController.saveProfile(req, res);
    else
      return res.redirect('/login');
  });

  app.get('/formularios', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return res.redirect('/index');
      else
        return formController.getReports(req, res);
    else
      return res.redirect('/login');
  });

  app.post('/formularios', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return res.redirect('/index');
      else
        return formController.createReport(req, res);
    else
      return res.redirect('/login');
  });

  app.get('/formularios/:reported_year', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return res.redirect('/index');
      else
        return formController.getReport(req, res);
    else
      return res.redirect('/login');
  });

  app.post('/formularios/:reported_year', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return res.redirect('/index');
      else
        return formController.processReport(req, res);
    else
      return res.redirect('/login');
  });

  app.get('/indicadores', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return indicatorsController.listIndicators(req, res);
  });

  app.post('/indicadores', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return indicatorsController.getIndicator(req, res);
  });

  app.get('/admin', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return adminController.getReports(req, res);
      else
        return res.redirect('/index');
    else
      return res.redirect('/login');
  });

  app.post('/admin', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return adminController.getReports(req, res);
      else
        return res.redirect('/index');
    else
      return res.redirect('/login');
  });

  app.get('/admin/review', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return adminController.reviewReport(req, res);
      else
        return res.redirect('/index');
    else
      return res.redirect('/login');
  });

  app.post('/admin/review', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      if (req.is_admin)
        return adminController.acceptOrDeclineReport(req, res);
      else
        return res.redirect('/index');
    else
      return res.redirect('/login');
  });

  // app.use('/', router);
};