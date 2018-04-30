const express = require('express');
const router = express.Router();

const formController = require('./controllers/form.controller');
const profileController = require('./controllers/profile.controller');

module.exports = (app, authentication) => {
  router.use(authentication);

  router.get('/', (req, res) => {
    // res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    return res.redirect('/index');
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
    return res.render('index', data);
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

  router.get('/formulario', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.getForms(req, res);
    else
      return res.redirect('/login');
  });

  router.post('/formulario', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.createForm(req, res);
    else
      return res.redirect('/login');
  });

  router.get('/formulario/:reported_year', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.getForm(req, res);
    else
      return res.redirect('/login');
  });

  router.post('/formulario/:reported_year', (req, res) => {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    if (req.user)
      return formController.processForm(req, res);
    else
      return res.redirect('/login');
  });

  app.use('/', router);
};