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
  const years = params.to_year - params.from_year + 1;
  if (years >= 0 && years <= 10) {
    let institutionQuery = db.collection('institutions')
      .where('reported_year', '>=', params.from_year)
      .where('reported_year', '<=', params.to_year);
    institutionQuery.get().then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found.');
        data.error = 'La consulta no ha arrojado resultados.';
        return res.render('select-report', data);
      } else {
        let institutions = querySnapshot.docs.map(doc => doc.data());
        institutions.sort();
        // console.log(institutions);
        let userCache = {};
        let results = [];
        let promiseChain = Promise.resolve();
        let lastUserId = '';
        let lastIndex = -1;
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
              result.reported_year = Number(institutions[i].reported_year);
              result.indicator = indicator;
              // console.log(indicator);
              const makeNextPromise = (institution, result) => () => {
                if (institution.user_id !== lastUserId) {
                  lastUserId = institution.user_id;
                  let indicators = [];
                  for (let j = params.from_year; j <= params.to_year; j++) {
                    indicators.push({ reported_year: Number(j) });
                  }
                  results.push({indicators: indicators});
                  console.log(indicators);
                  lastIndex = results.length - 1;
                }
                if (userCache[institution.user_id]) {
                  return Promise.resolve().then(() => {
                    results[lastIndex].institution_name = userCache[institution.user_id];
                    const index = results[lastIndex].indicators.findIndex((item) => {
                      return item.reported_year === result.reported_year;
                    });
                    return results[lastIndex].indicators[index].indicator = result.indicator;
                  });
                } else {
                  return admin.auth().getUser(institution.user_id)
                    .then(userRecord => {
                      results[lastIndex].institution_name = userRecord.displayName;
                      userCache[userRecord.uid] = userRecord.displayName;
                      // console.log('tiki');
                      const index = results[lastIndex].indicators.findIndex((item) => {
                        return item.reported_year === result.reported_year;
                      });
                      return results[lastIndex].indicators[index].indicator = result.indicator;
                    })
                    .catch(error => {
                      console.log('Error getting user', error);
                      data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
                      return res.render('select-report', data);
                    });
                }
              };

              promiseChain = promiseChain.then(makeNextPromise(institutions[i], result));
            }
          }
        }

        promiseChain.then(() => {
          data.results = results;
          console.log(results[0]);
          return res.render('select-report', data);
        });
      }
    }).catch(err => {
      console.log('Error getting document', err);
      data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
      return res.render('select-report', data);
    });
  } else {
    data.error = 'Rango de años invalido. (0 <= rango <= 10)';
    return res.render('select-report', data);
  }
}