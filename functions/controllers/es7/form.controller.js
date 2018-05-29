const admin = require('firebase-admin');
let db = admin.firestore();


exports.getReports = (req, res) => {
  let data = { user: req.user };
  let query = db.collection('reports')
    .where('user_id', '==', req.user.uid);
  query.get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found.');
      }
      data.reports = querySnapshot.docs.map(doc => doc.data());
      return db.collection('users')
        .where('user_id', '==', req.user.uid)
        .get()
    })
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        data.warning = 'Debe completar los datos de su perfil para porder crear reportes'
      }
      return res.render('select-form', data);
    })
    .catch(error => {
      console.log('Error: ', error);
      data.error = 'Error al consultar la base de datos';
      return res.render('select-form', data);
    });
};

exports.createReport = (req, res) => {
  let data = { user: req.user };
  let formData = req.body;
  let usersQuery = db.collection('users')
    .where('user_id', '==', req.user.uid);
  usersQuery.get()
    .then(querySnapshot => {
      if (querySnapshot.size === 1) {
        let query = db.collection('reports')
          .where('user_id', '==', req.user.uid)
          .where('reported_year', '==', Number(formData.reported_year));
        return query.get();
      } else {
        data.error = 'Debe completar los datos del perfil para crear reportes';
        return Promise.reject(new Error('User must have a profile'));
      }
    })
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found. Proceeding to create document');
        return db.collection('reports').doc().set({
          user_id: req.user.uid,
          reported_year: Number(formData.reported_year),
          status: 'Incompleto',
          created_at: (new Date()).toUTCString(),
          updated_at: (new Date()).toUTCString()
        });
      } else {
        data.error = 'El reporte ya existe';
        return Promise.reject(new Error('Report already exists'));
      }
    })
    .then(result => {
      data.success = 'Reporte creado correctamente';
      let query = db.collection('reports')
        .where('user_id', '==', req.user.uid);
      return query.get();
    })
    .catch(error => {
      console.log('Error: ', error);
      if (!data.error)
        data.error = 'Error al consultar la base de datos';
      let query = db.collection('reports')
        .where('user_id', '==', req.user.uid);
      return query.get();
    })
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found.');
      }
      data.reports = querySnapshot.docs.map(doc => doc.data());
      return res.render('select-form', data);
    })
    .catch(error => {
      console.log('Error: ', error);
      if (!data.error)
        data.error = 'Error al consultar la base de datos';
      return res.render('select-form', data);
    });
};

exports.getReport = (req, res) => {
  let data = { user: req.user };
  let query = db.collection('reports')
    .where('user_id', '==', req.user.uid)
    .where('reported_year', '==', Number(req.params.reported_year));
  query.get()
    .then(querySnapshot => {
      if (querySnapshot.empty || querySnapshot.size > 1) {
        console.log('No documents found.');
        data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
        return res.render('form', data);
      } else {
        data.report = querySnapshot.docs[0].data();
        return res.render('form', data);
      }
    })
    .catch(error => {
      console.log('Error: ', error);
      data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
      return res.render('form', data);
    });
};

exports.processReport = (req, res) => {
  // console.log(req.body);
  let data = { user: req.user };
  let formData = req.body;
  let query = db.collection('reports')
    .where('user_id', '==', req.user.uid)
    .where('reported_year', '==', Number(req.params.reported_year));
  query.get()
    .then(querySnapshot => {
      if (querySnapshot.empty || querySnapshot.size > 1) {
        console.log('No documents found.');
        data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
        return res.render('form', data);
      } else {
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

        // if (formData.studying_beneficiaries_amount) {
        //   institution.studying_beneficiaries_amount = formData.studying_beneficiaries_amount;
        // }
        //
        // if (formData.graduated_beneficiaries_amount) {
        //   institution.graduated_beneficiaries_amount = formData.graduated_beneficiaries_amount;
        // }

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
              obj.warranties = formData['program' + i + '_warranties'];
            else
              obj.warranties = [formData['program' + i + '_warranties']];
          }

          if (formData['program' + i + '_warranties_other'])
            obj.warranties_other = formData['program' + i + '_warranties_other'];

          if (formData['program' + i + '_guarantors']) {
            if (typeof formData['program' + i + '_guarantors'] === typeof [])
              obj.guarantors = formData['program' + i + '_guarantors'];
            else
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

        report.updated_at = (new Date()).toUTCString();

        data.report = report;
        let reportRef = querySnapshot.docs[0].ref;
        return reportRef.set(report, { merge: true })
          .then(result => {
            console.log('Data saved: ', result);
            data.success = 'Datos guardados exitosamente';
            return res.render('form', data);
          })
          .catch(error => {
            console.log('Error saving data', error);
            data.error = 'Error al guardar los datos';
            return res.render('form', data);
          });
      }
   })
    .catch(error => {
      console.log('Error: ', error);
      if (!data.error)
        data.error = 'Error al consultar los datos';
      data.report = formData;
      return res.render('form', data);
    });
};