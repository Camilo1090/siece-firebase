const admin = require('firebase-admin');
let db = admin.firestore();


exports.listIndicators = (req, res) => {
  let data = { user: req.user, is_admin: req.is_admin };

  return res.render('select-report', data);
};

exports.getIndicator = (req, res) => {
  let data = { user: req.user, is_admin: req.is_admin };
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

const financiamientoAnual = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        // .where('status', '==', 'Aceptado')
        .where('reported_year', '>=', Number(formData.from_year))
        .where('reported_year', '<=', Number(formData.to_year))
        .get();
      if (reportsSnapshot.empty) {
        console.log('No documents found.');
        data.warning = 'No hay datos reportados en el periodo seleccionado.';
      } else {
        let reports = reportsSnapshot.docs.map(doc => doc.data());
        // console.log(reports);
        let userCache = {};
        let results = [];
        for (let i = formData.from_year; i <= formData.to_year; i++) {
          let result = { reported_year: Number(i) };
          results.push(result);
        }

        for (let i = 0; i < reports.length; i++) {
          let total_investment = 0;
          let total_credits = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];
              // console.log(program);
              if (program.investment)
                total_investment += Number(program.investment);
              
              if (program.credit_pais) {
                if (program.credit_pais.new)
                  total_credits += Number(program.credit_pais.new);

                if (program.credit_pais.old)
                  total_credits += Number(program.credit_pais.old);
              }

              if (program.credit_exterior) {
                if (program.credit_exterior.new)
                  total_credits += Number(program.credit_exterior.new);

                if (program.credit_exterior.old)
                  total_credits += Number(program.credit_exterior.old);
              }
            }
          }

          // if (total_credits === 0)
          //   total_credits = 1;

          let indicatorValue = total_investment / total_credits;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = indicatorValue;
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = indicatorValue;
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.chart_results = results;
        data.table_results = tableResults(results, userCache, institutionNames);
        data.institution_names = institutionNames;
        console.log(data.chart_results, data.table_results);
      }
      return res.render('select-report', data);
    } catch(error) {
      console.log('Error: ', error);
      data.error = 'No se han podido recuperar los datos de la institución. Contacte al administrador.';
      return res.render('select-report', data);
    }
  } else {
    data.error = 'Rango de años invalido. (0 <= rango <= 10)';
    return res.render('select-report', data);
  }
};

const tableResults = (chartResults, userCache, institutionNames) => {
  let tableResults = [];
  for (let i = 0; i < institutionNames.length; i++) {
    let result = { institution_name: institutionNames[i], indicators: [] };
    for (let j = 0; j < chartResults.length; j++) {
      let indicator = { reported_year: chartResults[j].reported_year };
      const indicatorValue = chartResults[j][result.institution_name];
      if (indicatorValue) {
        indicator.value = Number(indicatorValue);
      }
      // console.log(indicator);
      result.indicators.push(indicator);
    }
    tableResults.push(result);
  }

  return tableResults;
};