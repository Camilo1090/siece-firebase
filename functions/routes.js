const express = require('express');
const router = express.Router();

let dir = 'es7';
if (process.env['NODE_ENV'] === 'production')
  dir = 'es5';

const indexController = require('./controllers/'+dir+'/index.controller');
const formController = require('./controllers/'+dir+'/form.controller');
const profileController = require('./controllers/'+dir+'/profile.controller');
const reportsController = require('./controllers/'+dir+'/reports.controller');


module.exports = (app, authentication) => {
  router.use(authentication);

  router.get('/', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.render('landing');
  });

  router.get('/login', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return res.redirect('/index');
    else
      return res.render('login');
  });

  router.post('/login', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return res.redirect('/index');
    else
      return res.render('login');
  });

  router.get('/index', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    let data = {};
    if (req.user)
      data.user = req.user;
    return indexController.getIndex(req, res);
  });

  router.get('/perfil', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return profileController.getProfile(req, res);
    else
      return res.redirect('/login');
  });

  router.post('/perfil', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return profileController.saveProfile(req, res);
    else
      return res.redirect('/login');
  });

  router.get('/formularios', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.getReports(req, res);
    else
      return res.redirect('/login');
  });

  router.post('/formularios', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.createReport(req, res);
    else
      return res.redirect('/login');
  });

  router.get('/formularios/:reported_year', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.getReport(req, res);
    else
      return res.redirect('/login');
  });

  router.post('/formularios/:reported_year', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.processReport(req, res);
    else
      return res.redirect('/login');
  });

  router.get('/indicadores', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return reportsController.listReports(req, res);
  });

  router.post('/indicadores', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return reportsController.getReport(req, res);
  });

  app.use('/', router);
};