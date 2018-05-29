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
    let institutionQuery = db.collection('reports')
      .where('reported_year', '>=', params.from_year)
      .where('reported_year', '<=', params.to_year);
    institutionQuery.get().then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found.');
        data.error = 'La consulta no ha arrojado resultados.';
        return res.render('select-report', data);
      } else {
        let institutions = querySnapshot.docs.map(doc => doc.data());
        // institutions.sort();
        // console.log(institutions);
        let userCache = {};
        let results = [];
        let promiseChain = Promise.resolve();
        for (let i = params.from_year; i <= params.to_year; i++) {
          let result = { reported_year: Number(i) };
          results.push(result);
        }
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

            const indicatorValue = total_investment / total_credits;
            if (indicatorValue) {
              // console.log(indicator);
              const makeNextPromise = (institution, indicatorValue) => () => {
                if (userCache[institution.user_id]) {
                  return Promise.resolve().then(() => {
                    return results[institution.reported_year - params.from_year][userCache[institution.user_id]] = indicatorValue;
                  });
                } else {
                  return admin.auth().getUser(institution.user_id)
                    .then(userRecord => {
                      userCache[institution.user_id] = userRecord.displayName;
                      return results[institution.reported_year - params.from_year][userCache[institution.user_id]] = indicatorValue;
                    })
                    .catch(error => {
                      console.log('Error getting user', error);
                      data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
                      return res.render('select-report', data);
                    });
                }
              };

              promiseChain = promiseChain.then(makeNextPromise(institutions[i], indicatorValue));
            }
          }
        }

        return promiseChain.then(() => {
          data.chart_results = results;
          data.table_results = tableResults(results, userCache);
          data.institution_names = Object.values(userCache);
          console.log(data.chart_results, data.table_results);
          return res.render('select-report', data);
        }).catch(err => {
          console.log('Error getting document', err);
          data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
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

function tableResults(chartResults, userCache) {
  let tableResults = [];
  const institutionNames = Object.values(userCache);
  for (let i = 0; i < institutionNames.length; i++) {
    let result = { institution_name: institutionNames[i], indicators: [] };
    for (let j = 0; j < chartResults.length; j++) {
      let indicator = { reported_year: chartResults[j].reported_year };
      const indicatorValue = chartResults[j][result.institution_name];
      if (indicatorValue)
        indicator.value = indicatorValue;
      // console.log(indicator);
      result.indicators.push(indicator);
    }
    tableResults.push(result);
  }

  return tableResults;
}