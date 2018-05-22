const admin = require('firebase-admin');
let db = admin.firestore();


exports.listReports = (req, res) => {
  let data = {};
  if (req.user)
    data.user = req.user;

  return res.render('select-report', data);
};

exports.getReport = (req, res) => {
  let data = {};
  if (req.user)
    data.user = req.user;
  data.selected_report = req.body.report;
  data.from_year = req.body.from_year;
  data.to_year = req.body.to_year;

  switch (req.body.report) {
    case 'financiamiento_anual': {
      return financiamientoAnual(req, res, data);
    }
    default: {
      data.error = "No ha seleccionado un indicador válido";
      return res.render('select-report', data);
    }
  }
};

function financiamientoAnual(req, res, data) {
  let params = req.body;
  let institutionQuery = db.collection('institutions').where('reported_year', '>=', params.from_year).where('reported_year', '<=', params.to_year);
  institutionQuery.get().then(querySnapshot => {
    if (querySnapshot.empty) {
      console.log('No documents found.');
      data.error = 'La consulta no ha arrojado resultados.';
      return res.render('select-report', data);
    } else {
      let institutions = querySnapshot.docs.map(doc => doc.data());
      // console.log(institutions);
      // let userCache = {};
      let results = [];
      let promiseChain = Promise.resolve();
      for (let i = 0; i < institutions.length; i++) {
        if (institutions[i].programs && institutions[i].programs.length > 0) {
          let total_investment = 0;
          let total_credits = 0;
          for (let j = 0; j < institutions[i].programs.length; j++) {
            const program = institutions[i].programs[j];
            // console.log(program);
            if (program.investment && program.credit_pais && program.credit_pais.new && program.credit_pais.old
              && program.credit_exterior && program.credit_exterior.new && program.credit_exterior.old) {
              // console.log(program.investment);
              total_investment += program.investment;
              total_credits += program.credit_pais.new + program.credit_pais.old + program.credit_exterior.new + program.credit_exterior.old;
            }
          }

          const indicator = total_investment / total_credits;
          if (indicator) {
            let result = {};
            result.reported_year = institutions[i].reported_year;
            result.indicator = indicator;
            // console.log(indicator);
            const makeNextPromise = (institution, result) => () => {
              return admin.auth().getUser(institution.user_id)
                .then(userRecord => {
                  result.institution_name = userRecord.displayName;
                  // userCache[userRecord.uid] = userRecord.displayName;
                  // console.log('tiki');
                  return results.push(result);
                })
                .catch(error => {
                  console.log('Error getting user', error);
                  data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
                  return res.render('select-report', data);
                });
            };

            promiseChain = promiseChain.then(makeNextPromise(institutions[i], result));
          }
        }
      }

      promiseChain.then(() => {
        data.results = results;
        console.log(results);
        return res.render('select-report', data);
      });
    }
  }).catch(err => {
    console.log('Error getting document', err);
    data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
    return res.render('select-report', data);
  });
}