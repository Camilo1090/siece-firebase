const admin = require('firebase-admin');
let db = admin.firestore();


exports.getForms = (req, res) => {
  let data = { user: req.user };
  db.collection('institutions').where('user_id', '==', req.user.uid).get().then(querySnapshot => {
    if (querySnapshot.empty) {
      console.log('No documents found.');
    }
    let formDocs = querySnapshot.docs;
    let forms = formDocs.map(doc => {
      doc = doc.data();
      return doc;
    });
    return res.render('select-form', {
      user: req.user,
      forms: forms
    });
  }).catch(err => {
    console.log('Error getting document', err);
    data.error = 'Error al consultar la base de datos';
    return res.render('select-form', data);
  });
};

exports.createForm = (req, res) => {
  let data = { user: req.user };
  let params = req.body;
  db.collection('institutions').where('user_id', '==', req.user.uid).where('reported_year', '==', params.reported_year)
    .get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found. Proceeding to create document');
        return db.collection('institutions').doc().set({
          user_id: req.user.uid,
          reported_year: params.reported_year,
          status: 'En edición',
          created_at: (new Date()).toUTCString(),
          updated_at: (new Date()).toUTCString()
        }).then(result => {
          data.success = 'Reporte creado correctamente';
          return db.collection('institutions').where('user_id', '==', req.user.uid)
            .get()
            .then(querySnapshot => {
              if (querySnapshot.empty) {
                console.log('No documents found.');
              }
              let formDocs = querySnapshot.docs;
              data.forms = formDocs.map(doc => {
                doc = doc.data();
                return doc;
              });
              return res.render('select-form', data);
            })
            .catch(error => {
              console.log('Error getting document', error);
              data.error = 'Error al consultar la base de datos';
              return res.render('select-form', data);
            });
        }).catch(error => {
          console.log('Error getting document', error);
          data.error = 'Error al crear el reporte';
          return res.render('select-form', data);
        });
      } else {
        data.error = 'El reporte ya existe';
        return db.collection('institutions').where('user_id', '==', req.user.uid)
          .get()
          .then(querySnapshot => {
            if (querySnapshot.empty) {
              console.log('No documents found.');
            }
            let formDocs = querySnapshot.docs;
            data.forms = formDocs.map(doc => {
              doc = doc.data();
              return doc;
            });
            return res.render('select-form', data);
          })
          .catch(error => {
            console.log('Error getting document', error);
            data.error = 'Error al consultar la base de datos';
            return res.render('select-form', data);
          });
      }
    })
    .catch(err => {
      console.log('Error getting document', err);
      data.error = 'Error al consultar la base de datos';
      return res.render('select-form', data);
    });
};

exports.getForm = (req, res) => {
  console.log(req.params);
  let institutionQuery = db.collection('institutions').where('user_id', '==', req.user.uid).where('reported_year', '==', req.params.reported_year);
  institutionQuery.get().then(querySnapshot => {
    if (querySnapshot.empty || querySnapshot.size > 1) {
      console.log('No documents found.');
      return res.render('form', {
        user: req.user,
        error: 'No se han podido recuperar los datos de la institución. Contacte al administrador.'
      });
    } else {
      let institutionDoc = querySnapshot.docs[0];
      return res.render('form', {
        user: req.user,
        data: institutionDoc.data()
      });
    }
  }).catch(err => {
    console.log('Error getting document', err);
    return res.render('form', {
      user: req.user,
      error: 'No se han podido recuperar los datos de la institución. Contacte al administrador.'
    });
  });
};

exports.processForm = (req, res) => {
  console.log(req.body);
  let params = req.body;
  let institutionQuery = db.collection('institutions').where('user_id', '==', req.user.uid).where('reported_year', '==', req.params.reported_year);
  institutionQuery.get().then(querySnapshot => {
    if (querySnapshot.empty || querySnapshot.size > 1) {
      console.log('No documents found.');
      return res.render('form', {
        user: req.user,
        error: 'No se han podido recuperar los datos de la institución. Contacte al administrador.'
      });
    } else {
      let institution = {};
      if (params.type) {
        let type = {};
        type.name = params.type;
        params.type_other ? type.other = params.type_other : type.other = '';
        institution.type = type;
      }

      if (params.character) {
        let character = {};
        character.name = params.character;
        params.character_other ? character.other = params.character_other : character.other = '';
        institution.character = character;
      }

      if (params.country) {
        institution.country = params.country;
      }

      if (params.foundation_year) {
        institution.foundation_year = Number(params.foundation_year);
      }

      // let representative = {};
      if (params.representative_name) {
        institution.representative_name = params.representative_name;
        // representative.name = params.representative_name;
      }
      if (params.representative_position) {
        institution.representative_position = params.representative_position;
        // representative.position = params.representative_position;
      }
      // institution.representative = representative;

      if (params.employees) {
        institution.employees = Number(params.employees);
      }

      if (params.has_platform) {
        institution.has_platform = params.has_platform;
      }

      if (params.platform_ownership) {
        institution.platform_ownership = params.platform_ownership;
      }

      let sources = [];
      let obj;
      if (params.sources && params.source_amounts) {
        if (typeof params.sources === typeof []) {
          for (let i = 0; i < params.sources.length; i++) {
            obj = {};
            obj.source = params.sources[i];
            obj.amount = params.source_amounts[i];
            if (obj.source === 'otra')
              obj.name = params.source_otra_name;
            sources.push(obj);
          }
        } else {
          obj = {};
          obj.source = params.sources;
          obj.amount = params.source_amounts;
          if (obj.source === 'otra')
            obj.name = params.source_otra_name;
          sources.push(obj);
        }
      }
      institution.funding_sources = sources;

      if (params.regulated) {
        institution.regulated = params.regulated;
        params.regulating_entity ? institution.regulating_entity = params.regulating_entity : institution.regulating_entity = '';
      }

      if (params.credit_rating) {
        institution.credit_rating = params.credit_rating;
        params.rating_agency ? institution.rating_agency = params.rating_agency : institution.rating_agency = '';
      }

      if (params.total_investment) {
        institution.total_investment = params.total_investment;
      }

      if (params.total_students) {
        institution.total_students = params.total_students;
      }

      let current_portfolio = [];
      if (params.current_portfolio && params.current_portfolio_amounts) {
        if (typeof params.current_portfolio === typeof []) {
          for (i = 0; i < params.current_portfolio.length; i++) {
            obj = {};
            obj.name = params.current_portfolio[i];
            obj.amount = params.current_portfolio_amounts[i];
            current_portfolio.push(obj);
          }
        } else {
          obj = {};
          obj.name = params.current_portfolio;
          obj.amount = params.current_portfolio_amounts;
          current_portfolio.push(obj);
        }
      }
      institution.current_portfolio = current_portfolio;

      // if (params.studying_beneficiaries_amount) {
      //   institution.studying_beneficiaries_amount = params.studying_beneficiaries_amount;
      // }
      //
      // if (params.graduated_beneficiaries_amount) {
      //   institution.graduated_beneficiaries_amount = params.graduated_beneficiaries_amount;
      // }

      let pastdue_portfolio = [];
      if (params.pastdue_portfolio && params.pastdue_portfolio_amounts) {
        if (typeof params.pastdue_portfolio === typeof []) {
          for (i = 0; i < params.pastdue_portfolio.length; i++) {
            obj = {};
            obj.name = params.pastdue_portfolio[i];
            obj.amount = params.pastdue_portfolio_amounts[i];
            pastdue_portfolio.push(obj);
          }
        } else {
          obj = {};
          obj.name = params.pastdue_portfolio;
          obj.amount = params.pastdue_portfolio_amounts;
          pastdue_portfolio.push(obj);
        }
      }
      institution.pastdue_portfolio = pastdue_portfolio;

      let execution_portfolio = [];
      if (params.execution_portfolio && params.execution_portfolio_amounts) {
        if (typeof params.execution_portfolio === typeof []) {
          for (i = 0; i < params.execution_portfolio.length; i++) {
            obj = {};
            obj.name = params.execution_portfolio[i];
            obj.amount = params.execution_portfolio_amounts[i];
            execution_portfolio.push(obj);
          }
        } else {
          obj = {};
          obj.name = params.execution_portfolio;
          obj.amount = params.execution_portfolio_amounts;
          execution_portfolio.push(obj);
        }
      }
      institution.execution_portfolio = execution_portfolio;

      let risks = [];
      if (params.risks) {
        if (typeof params.risks === typeof []) {
          risks = params.risks;
        } else {
          risks.push(params.risks);
        }
        params.risks_other ? institution.risks_other = params.risks_other : institution.risks_other = '';
      }
      institution.risks = risks;

      if (params.risk_increasing_actions) {
        institution.risk_increasing_actions = params.risk_increasing_actions;
      }

      if (params.risk_mitigating_actions) {
        institution.risk_mitigating_actions = params.risk_mitigating_actions;
      }

      if (params.non_payment_risk) {
        let non_payment_risk = {};
        non_payment_risk.risk = params.non_payment_risk;
        if (params.non_payment_risk_si)
          non_payment_risk.name = params.non_payment_risk_si;
        if (params.non_payment_risk_si_other)
          non_payment_risk.other = params.non_payment_risk_si_other;
        institution.non_payment_risk = non_payment_risk;
      }

      if (params.male_students) {
        institution.male_students = params.male_students;
      }

      if (params.female_students) {
        institution.female_students = params.female_students;
      }

      if (params.high_students) {
        institution.high_students = params.high_students;
      }

      if (params.medium_students) {
        institution.medium_students = params.medium_students;
      }

      if (params.low_students) {
        institution.low_students = params.low_students;
      }

      if (params.graduate_percentage) {
        institution.graduate_percentage = params.graduate_percentage;
      }

      if (params.benefits) {
        let benefits = {};
        benefits.option = params.benefits;
        if (params.benefits_cuales)
          benefits.names = params.benefits_cuales;
        institution.benefits = benefits;
      }

      // programs
      let programs = [];
      for (i = 1; i <= params.program_quantity; i++) {
        obj = {};
        if (params['program' + i + '_name'])
          obj.name = params['program' + i + '_name'];
        if (params['program' + i + '_beneficiaries'])
          obj.beneficiaries = params['program' + i + '_beneficiaries'];
        if (params['program' + i + '_term'])
          obj.term = params['program' + i + '_term'];
        if (params['program' + i + '_investment'])
          obj.investment = params['program' + i + '_investment'];
        if (params['program' + i + '_rate']) {
          let rate = {};
          rate.type = params['program' + i + '_rate'];
          rate.percentage = params['program' + i + '_rate_percentage'];
          obj.rate = rate;
        }
        if (params['program' + i + '_repayment']) {
          let repayment = {};
          repayment.type = params['program' + i + '_repayment'];
          if (repayment.type === 'otra')
            repayment.other = params['program' + i + '_repayment_other'];
          obj.repayment = repayment;
        }
        if (params['program' + i + '_grace'])
          obj.grace = params['program' + i + '_grace'];
        if (params['program' + i + '_warranties']) {
          if (typeof params['program' + i + '_warranties'] === typeof [])
            obj.warranties = params['program' + i + '_warranties'];
          else
            obj.warranties = [params['program' + i + '_warranties']];
        }
        if (params['program' + i + '_warranties_other'])
          obj.warranties_other = params['program' + i + '_warranties_other'];
        if (params['program' + i + '_guarantors']) {
          if (typeof params['program' + i + '_guarantors'] === typeof [])
            obj.guarantors = params['program' + i + '_guarantors'];
          else
            obj.guarantors = [params['program' + i + '_guarantors']];
        }
        if (params['program' + i + '_guarantors_other'])
          obj.guarantors_other = params['program' + i + '_guarantors_other'];
        if (params['program' + i + '_credit']) {
          let credit = {};
          credit.type = params['program' + i + '_credit'];
          if (params['program' + i + '_credit_new'])
            credit.new = params['program' + i + '_credit_new'];
          if (params['program' + i + '_credit_old'])
            credit.old = params['program' + i + '_credit_old'];
          obj.credit = credit;
        }

        programs.push(obj);
      }
      institution.programs = programs;

      institution.updated_at = (new Date()).toUTCString();

      let institutionRef = querySnapshot.docs[0].ref;
      return institutionRef.set(institution, { merge: true }).then(result => {
        console.log('Data saved');
        return res.render('form', {
          user: req.user,
          data: institution,
          success: 'Datos guardados exitosamente'
        });
      }).catch(err => {
        console.log('Error saving data', err);
        return res.render('form', {
          user: req.user,
          data: institution,
          error: 'Error al guardar los datos'
        });
      });
    }
  }).catch(err => {
    console.log('Error getting document', err);
    return res.render('form', {
      user: req.user,
      error: 'Error al consultar los datos'
    });
  });
};