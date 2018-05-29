'use strict';var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}const countries = require('i18n-iso-countries');
const admin = require('firebase-admin');
let db = admin.firestore();

exports.getIndex = (() => {var _ref = (0, _asyncToGenerator3.default)(function* (req, res) {
    let data = {};
    if (req.user)
    data.user = req.user;
    const reportedYear =
    2016;
    // ((new Date()).getFullYear() - 1).toString();
    data.reported_year = reportedYear;
    try {
      const querySnapshot = yield db.collection('reports').
      where('reported_year', '==', reportedYear)
      // .where('status', '==', 'finalizado')
      .get();
      // let batch = db.batch();
      // querySnapshot.docs.forEach(doc => {
      //   batch.delete(doc.ref);
      // });
      // await batch.commit();
      if (querySnapshot.empty) {
        console.log('No documents found.');
      } else {
        console.log('Documents found.');
        let reports = querySnapshot.docs.map(function (doc) {return doc.data();});
        // console.log(reports);
        topStatistics(reports, data);
        yield investmentByCountry(reports, data);
        yield investmentByInstitution(reports, data, res);
        data.investment_by_institution.sort(function (a, b) {
          if (a.amount > b.amount)
          return -1;
          return 1;
        });
        data.investment_by_institution = data.investment_by_institution.slice(0, 4);
        if (data.investment_by_institution.length > 0) {
          const maxAmount = data.investment_by_institution[0].amount;
          data.investment_by_institution.forEach(function (item) {
            item.progress = item.amount / maxAmount * 100;
            item.amount = item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          });
        }
      }
      console.log(data);
      return res.render('index', data);
    } catch (error) {
      console.log('Error: ', error);
      data.error = 'Error al consultar la base de datos';
      return res.render('index', data);
    }
  });return function (_x, _x2) {return _ref.apply(this, arguments);};})();

const topStatistics = (reports, data) => {
  data.forms = reports.length;
  let totalBeneficiaries = 0;
  let totalFemale = 0;
  let totalMale = 0;
  let totalInvestment = 0;
  for (let i = 0; i < reports.length; i++) {
    if (reports[i].programs) {
      for (let j = 0; j < reports[i].programs.length; j++) {
        totalBeneficiaries += Number(reports[i].programs[j].beneficiaries);
        totalInvestment += Number(reports[i].programs[j].investment);
      }
      totalFemale += Number(reports[i].female_students);
      totalMale += Number(reports[i].male_students);
    }
  }
  data.total_beneficiaries = totalBeneficiaries;
  if (totalBeneficiaries > 0) {
    data.percentage_female = (totalFemale / totalBeneficiaries * 100).toFixed(2);
    data.percentage_male = (totalMale / totalBeneficiaries * 100).toFixed(2);
  }
  data.total_investment = totalInvestment.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getInstitutionCountry = (() => {var _ref2 = (0, _asyncToGenerator3.default)(function* (report) {
    const querySnapshot = yield db.collection('users').
    where('user_id', '==', report.user_id).
    get();
    return querySnapshot.docs[0].data().country;
  });return function getInstitutionCountry(_x3) {return _ref2.apply(this, arguments);};})();

const investmentByCountry = (() => {var _ref3 = (0, _asyncToGenerator3.default)(function* (reports, data) {
    let investments = [];
    for (let i = 0; i < reports.length; i++) {
      if (reports[i].programs) {
        const institutionCountry = yield getInstitutionCountry(reports[i]);
        let investment = investments.find(function (item) {return item.country_code === institutionCountry;});
        if (!investment) {
          investment = {
            country_code: institutionCountry,
            country_name: countries.getName(institutionCountry, 'es'),
            amount: 0 };

          investments.push(investment);
        }
        for (let j = 0; j < reports[i].programs.length; j++) {
          investment.amount += Number(reports[i].programs[j].investment);
        }
      }
    }
    investments.sort(function (a, b) {
      if (a.amount > b.amount)
      return -1;
      return 1;
    });
    data.investment_by_country = investments.slice(0, 15);
  });return function investmentByCountry(_x4, _x5) {return _ref3.apply(this, arguments);};})();

const investmentByInstitution = (() => {var _ref4 = (0, _asyncToGenerator3.default)(function* (reports, data, res) {
    data.investment_by_institution = [];
    for (let i = 0; i < reports.length; i++) {
      if (reports[i].programs && reports[i].programs.length > 0) {
        let amount = 0;
        for (let j = 0; j < reports[i].programs.length; j++) {
          amount += Number(reports[i].programs[j].investment);
        }
        const querySnapshot = yield db.collection('users').
        where('user_id', '==', reports[i].user_id).
        get();
        const institutionName = querySnapshot.docs[0].data().name;
        const investment = {
          user_id: reports[i].user_id,
          institution_name: institutionName,
          amount: amount };

        data.investment_by_institution.push(investment);
      }
    }
  });return function investmentByInstitution(_x6, _x7, _x8) {return _ref4.apply(this, arguments);};})();