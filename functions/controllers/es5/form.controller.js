'use strict';var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}const admin = require('firebase-admin');
let db = admin.firestore();


exports.getReports = (() => {var _ref = (0, _asyncToGenerator3.default)(function* (req, res) {
    let data = { user: req.user };
    try {
      const usersSnapshot = yield db.collection('users').
      where('user_id', '==', req.user.uid).
      get();

      if (usersSnapshot.empty) {
        data.warning = 'Debe completar los datos de su perfil para porder crear reportes.';
      } else {
        const reportsSnapshot = yield db.collection('reports').
        where('user_id', '==', req.user.uid).
        get();

        if (reportsSnapshot.empty) {
          console.log('No documents found.');
        }

        data.reports =
        reportsSnapshot.docs.map(function (doc) {
          let report = doc.data();
          report = {
            // institution_name: await getInstitutionName(report.user_id),
            user_id: report.user_id,
            reported_year: report.reported_year,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at,
            editable: report.status === 'Incompleto' };

          return report;
        });
      }

      return res.render('select-form', data);
    } catch (error) {
      console.log('Error: ', error);
      data.error = 'Error al consultar la base de datos';
      return res.render('select-form', data);
    }
  });return function (_x, _x2) {return _ref.apply(this, arguments);};})();

exports.createReport = (() => {var _ref2 = (0, _asyncToGenerator3.default)(function* (req, res) {
    let data = { user: req.user };
    const formData = req.body;
    const usersSnapshot = yield db.collection('users').
    where('user_id', '==', req.user.uid).
    get();
    try {
      if (usersSnapshot.size === 1) {
        const reportsSnapshot = yield db.collection('reports').
        where('user_id', '==', req.user.uid).
        where('reported_year', '==', Number(formData.reported_year)).
        get();
        if (reportsSnapshot.empty) {
          console.log('No documents found. Proceeding to create document');
          yield db.collection('reports').doc().set({
            user_id: req.user.uid,
            reported_year: Number(formData.reported_year),
            status: 'Incompleto',
            created_at: new Date().toUTCString(),
            updated_at: new Date().toUTCString() });

          data.success = 'Reporte creado correctamente';
        } else {
          console.log('Error: ', 'Report already exists');
          data.error = 'El reporte ya existe';
        }
      } else {
        console.log('Error: ', 'User must have a user profile');
        data.error = 'Debe completar los datos del perfil para crear reportes';
      }

      const reportsSnapshot = yield db.collection('reports').
      where('user_id', '==', req.user.uid).
      get();
      if (reportsSnapshot.empty) {
        console.log('No documents found.');
      } else {
        data.reports = reportsSnapshot.docs.map(function (doc) {
          let report = doc.data();
          report = {
            // institution_name: await getInstitutionName(report.user_id),
            user_id: report.user_id,
            reported_year: report.reported_year,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at,
            editable: report.status === 'Incompleto' };

          return report;
        });
      }
      return res.render('select-form', data);
    } catch (error) {
      console.log('Error: ', error);
      if (!data.error)
      data.error = 'Error al consultar la base de datos';
      return res.render('select-form', data);
    }
  });return function (_x3, _x4) {return _ref2.apply(this, arguments);};})();

exports.getReport = (() => {var _ref3 = (0, _asyncToGenerator3.default)(function* (req, res) {
    let data = { user: req.user };
    const reportsSnapshot = yield db.collection('reports').
    where('user_id', '==', req.user.uid).
    where('reported_year', '==', Number(req.params.reported_year)).
    get();
    try {
      if (reportsSnapshot.size === 1) {
        data.report = reportsSnapshot.docs[0].data();
        if (data.report.status !== 'Incompleto') {
          data.error = 'El reporte ya fué enviado para revisión o ya está completo.';
          data.report = null;
        }
      } else {
        console.log('Duplicate or non-existent report');
        data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
      }
      return res.render('form', data);
    } catch (error) {
      console.log('Error: ', error);
      data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
      return res.render('form', data);
    }
  });return function (_x5, _x6) {return _ref3.apply(this, arguments);};})();

exports.processReport = (() => {var _ref4 = (0, _asyncToGenerator3.default)(function* (req, res) {
    // console.log(req.body);
    let data = { user: req.user };
    const formData = req.body;
    const reportsSnapshot = yield db.collection('reports').
    where('user_id', '==', req.user.uid).
    where('reported_year', '==', Number(req.params.reported_year)).
    get();
    try {
      if (reportsSnapshot.size === 1) {
        if (reportsSnapshot.docs[0].data().status === 'Incompleto') {
          let report = {};

          let sources = [];
          let obj;
          if (formData.sources && formData.source_amounts) {
            if (typeof formData.sources === typeof []) {
              for (let i = 0; i < formData.sources.length; i++) {
                obj = {};
                obj.source = formData.sources[i];
                obj.amount = formData.source_amounts[i];
                if (obj.source === 'otra')
                obj.name = formData.source_otra_name;
                sources.push(obj);
              }
            } else {
              obj = {};
              obj.source = formData.sources;
              obj.amount = Number(formData.source_amounts);
              if (obj.source === 'otra')
              obj.name = formData.source_otra_name;
              sources.push(obj);
            }
          }
          report.funding_sources = sources;

          if (formData.regulated) {
            report.regulated = formData.regulated;
            formData.regulating_entity ? report.regulating_entity = formData.regulating_entity : report.regulating_entity = '';
          }

          if (formData.credit_rating) {
            report.credit_rating = formData.credit_rating;
            formData.rating_agency ? report.rating_agency = formData.rating_agency : report.rating_agency = '';
          }

          if (formData.total_investment) {
            report.total_investment = Number(formData.total_investment);
          }

          if (formData.total_students) {
            report.total_students = Number(formData.total_students);
          }

          let current_portfolio = [];
          if (formData.current_portfolio && formData.current_portfolio_amounts) {
            if (typeof formData.current_portfolio === typeof []) {
              for (let i = 0; i < formData.current_portfolio.length; i++) {
                obj = {};
                obj.name = formData.current_portfolio[i];
                obj.amount = Number(formData.current_portfolio_amounts[i]);
                current_portfolio.push(obj);
              }
            } else {
              obj = {};
              obj.name = formData.current_portfolio;
              obj.amount = Number(formData.current_portfolio_amounts);
              current_portfolio.push(obj);
            }
          }
          report.current_portfolio = current_portfolio;

          if (formData.current_portfolio_male) {
            report.current_portfolio_male = Number(formData.current_portfolio_male);
          }

          if (formData.current_portfolio_female) {
            report.current_portfolio_female = Number(formData.current_portfolio_female);
          }

          let pastdue_portfolio = [];
          if (formData.pastdue_portfolio && formData.pastdue_portfolio_amounts) {
            if (typeof formData.pastdue_portfolio === typeof []) {
              for (let i = 0; i < formData.pastdue_portfolio.length; i++) {
                obj = {};
                obj.name = formData.pastdue_portfolio[i];
                obj.amount = Number(formData.pastdue_portfolio_amounts[i]);
                pastdue_portfolio.push(obj);
              }
            } else {
              obj = {};
              obj.name = formData.pastdue_portfolio;
              obj.amount = Number(formData.pastdue_portfolio_amounts);
              pastdue_portfolio.push(obj);
            }
          }
          report.pastdue_portfolio = pastdue_portfolio;

          if (formData.pastdue_portfolio_male) {
            report.pastdue_portfolio_male = Number(formData.pastdue_portfolio_male);
          }

          if (formData.pastdue_portfolio_female) {
            report.pastdue_portfolio_female = Number(formData.pastdue_portfolio_female);
          }

          let execution_portfolio = [];
          if (formData.execution_portfolio && formData.execution_portfolio_amounts) {
            if (typeof formData.execution_portfolio === typeof []) {
              for (let i = 0; i < formData.execution_portfolio.length; i++) {
                obj = {};
                obj.name = formData.execution_portfolio[i];
                obj.amount = Number(formData.execution_portfolio_amounts[i]);
                execution_portfolio.push(obj);
              }
            } else {
              obj = {};
              obj.name = formData.execution_portfolio;
              obj.amount = Number(formData.execution_portfolio_amounts);
              execution_portfolio.push(obj);
            }
          }
          report.execution_portfolio = execution_portfolio;

          if (formData.execution_portfolio_male) {
            report.execution_portfolio_male = Number(formData.execution_portfolio_male);
          }

          if (formData.execution_portfolio_female) {
            report.execution_portfolio_female = Number(formData.execution_portfolio_female);
          }

          let risks = [];
          if (formData.risks) {
            if (typeof formData.risks === typeof []) {
              risks = formData.risks;
            } else {
              risks.push(formData.risks);
            }
            formData.risks_other ? report.risks_other = formData.risks_other : report.risks_other = '';
          }
          report.risks = risks;

          if (formData.risk_increasing_actions) {
            report.risk_increasing_actions = formData.risk_increasing_actions;
          }

          if (formData.risk_mitigating_actions) {
            report.risk_mitigating_actions = formData.risk_mitigating_actions;
          }

          if (formData.non_payment_risk) {
            let non_payment_risk = {};
            non_payment_risk.risk = formData.non_payment_risk;
            if (formData.non_payment_risk_si)
            non_payment_risk.name = formData.non_payment_risk_si;
            if (formData.non_payment_risk_si_other)
            non_payment_risk.other = formData.non_payment_risk_si_other;
            report.non_payment_risk = non_payment_risk;
          }

          if (formData.male_students) {
            report.male_students = Number(formData.male_students);
          }

          if (formData.female_students) {
            report.female_students = Number(formData.female_students);
          }

          if (formData.high_students) {
            report.high_students = Number(formData.high_students);
          }

          if (formData.medium_students) {
            report.medium_students = Number(formData.medium_students);
          }

          if (formData.low_students) {
            report.low_students = Number(formData.low_students);
          }

          if (formData.graduate_percentage) {
            report.graduate_percentage = Number(formData.graduate_percentage);
          }

          if (formData.benefits) {
            let benefits = {};
            benefits.option = formData.benefits;
            if (formData.benefits_cuales)
            benefits.names = formData.benefits_cuales;
            report.benefits = benefits;
          }

          // programs
          let programs = [];
          for (let i = 1; i <= formData.program_quantity; i++) {
            obj = {};
            if (formData['program' + i + '_level'])
            obj.level = formData['program' + i + '_level'];

            if (formData['program' + i + '_name'])
            obj.name = formData['program' + i + '_name'];

            if (formData['program' + i + '_beneficiaries'])
            obj.beneficiaries = Number(formData['program' + i + '_beneficiaries']);

            if (formData['program' + i + '_term'])
            obj.term = formData['program' + i + '_term'];

            if (formData['program' + i + '_investment'])
            obj.investment = Number(formData['program' + i + '_investment']);

            if (formData['program' + i + '_rate']) {
              let rate = {};
              rate.type = formData['program' + i + '_rate'];
              rate.percentage = Number(formData['program' + i + '_rate_percentage']);
              obj.rate = rate;
            }

            if (formData['program' + i + '_repayment']) {
              let repayment = {};
              repayment.type = formData['program' + i + '_repayment'];
              if (repayment.type === 'otra')
              repayment.other = formData['program' + i + '_repayment_other'];
              obj.repayment = repayment;
            }

            if (formData['program' + i + '_grace'])
            obj.grace = formData['program' + i + '_grace'];

            if (formData['program' + i + '_warranties']) {
              if (typeof formData['program' + i + '_warranties'] === typeof [])
              obj.warranties = formData['program' + i + '_warranties'];else

              obj.warranties = [formData['program' + i + '_warranties']];
            }

            if (formData['program' + i + '_warranties_other'])
            obj.warranties_other = formData['program' + i + '_warranties_other'];

            if (formData['program' + i + '_guarantors']) {
              if (typeof formData['program' + i + '_guarantors'] === typeof [])
              obj.guarantors = formData['program' + i + '_guarantors'];else

              obj.guarantors = [formData['program' + i + '_guarantors']];
            }

            if (formData['program' + i + '_guarantors_other'])
            obj.guarantors_other = formData['program' + i + '_guarantors_other'];

            let credit_pais = {};
            if (formData['program' + i + '_credit_pais_new'])
            credit_pais.new = Number(formData['program' + i + '_credit_pais_new']);
            if (formData['program' + i + '_credit_pais_old'])
            credit_pais.old = Number(formData['program' + i + '_credit_pais_old']);
            obj.credit_pais = credit_pais;

            let credit_exterior = {};
            if (formData['program' + i + '_credit_exterior_new'])
            credit_exterior.new = Number(formData['program' + i + '_credit_exterior_new']);
            if (formData['program' + i + '_credit_exterior_old'])
            credit_exterior.old = Number(formData['program' + i + '_credit_exterior_old']);
            obj.credit_exterior = credit_exterior;

            programs.push(obj);
          }
          report.programs = programs;

          report.updated_at = new Date().toUTCString();

          if (formData.complete)
          report.status = 'Enviado';else

          report.status = 'Incompleto';

          data.report = report;
          const result = yield reportsSnapshot.docs[0].ref.set(report, { merge: true });
          console.log('Data saved: ', result);
          data.success = 'Datos guardados exitosamente';
        } else {
          data.error = 'El reporte ya fué enviado para revisión o ya está completo.';
        }
      } else {
        console.log('Duplicate or non-existent report.');
        data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
      }
      if (formData.complete)
      return res.redirect('/formularios');else

      return res.render('form', data);
    } catch (error) {
      console.log('Error: ', error);
      if (!data.error)
      data.error = 'Error al consultar la base de datos';
      data.report = formData;
      return res.render('form', data);
    }
  });return function (_x7, _x8) {return _ref4.apply(this, arguments);};})();