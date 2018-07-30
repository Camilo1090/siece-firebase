const admin = require('firebase-admin');
const db = admin.firestore();
const underscore = require('underscore');


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
      data.indicator_name = 'Monto promedio de crédito educativo por año';
      return financiamientoAnual(req, res, data);
    }
    case 'financiamiento_beneficiario': {
      data.indicator_name = 'Monto promedio de crédito educativo por beneficiario para el año que se reporta';
      return financiamientoBeneficiario(req, res, data);
    }
    case 'financiamiento_institucion': {
      data.indicator_name = 'Monto promedio de crédito educativo por beneficiario desde el inicio del programa de CE hasta el año que se reporta';
      return financiamientoInstitucion(req, res, data);
    }
    case 'financiamiento_fuentes': {
      data.indicator_name = 'Proporción de financiación de CE según fuente de financiamiento por año';
      return financiamientoFuentes(req, res, data);
    }
    case 'variacion_anual': {
      data.indicator_name = 'Variación anual de CE';
      return variacionAnual(req, res, data);
    }
    case 'asignacion_lugar': {
      data.indicator_name = 'Propoción de CE según el lugar de estudios';
      return asignacionLugar(req, res, data);
    }
    case 'asignacion_nivel': {
      data.indicator_name = 'Propoción de CE según el nivel de estudios';
      return asignacionNivel(req, res, data);
    }
    case 'asignacion_genero': {
      data.indicator_name = 'Propoción de CE según el género';
      return asignacionGenero(req, res, data);
    }
    case 'asignacion_nuevo': {
      data.indicator_name = 'Proporción anual de CE nuevo según el lugar de estudios';
      return asignacionNuevo(req, res, data);
    }
    case 'asignacion_nuevo_nivel': {
      data.indicator_name = 'Proporción anual de CE nuevo según el nivel de estudios';
      return asignacionNuevoNivel(req, res, data);
    }
    case 'variacion_cartera': {
      data.indicator_name = 'Variación anual de la cartera';
      return variacionCartera(req, res, data);
    }
    case 'cartera_vigente_nivel': {
      data.indicator_name = 'Proporción anual de la cartera vigente según el nivel de estudios';
      return carteraVigenteNivel(req, res, data);
    }
    case 'cartera_vigente_lugar': {
      data.indicator_name = 'Proporción anual de la cartera vigente según el lugar de estudios';
      return carteraVigenteLugar(req, res, data);
    }
    case 'cartera_vigente_genero': {
      data.indicator_name = 'Proporción anual de la cartera vigente según el género';
      return carteraVigenteGenero(req, res, data);
    }
    case 'cartera_vencida': {
      data.indicator_name = 'Proporción anual de la cartera vencida';
      return carteraVencida(req, res, data);
    }
    case 'cartera_vencida_nivel': {
      data.indicator_name = 'Proporción anual de la cartera vencida según el nivel de estudios';
      return carteraVencidaNivel(req, res, data);
    }
    case 'cartera_vencida_lugar': {
      data.indicator_name = 'Proporción anual de la cartera vencida según el lugar de estudios';
      return carteraVencidaLugar(req, res, data);
    }
    case 'cartera_vencida_genero': {
      data.indicator_name = 'Proporción anual de la cartera vencida según el género';
      return carteraVencidaGenero(req, res, data);
    }
    case 'empleado_beneficiario': {
      data.indicator_name = 'Relación empleado-beneficiario de CE';
      return empleadoBeneficiario(req, res, data);
    }
    case 'plataforma': {
      data.indicator_name = 'Proporción de ICE con plataforma tecnológica';
      return plataformaTecnologica(req, res, data);
    }
    case 'regulacion': {
      data.indicator_name = 'Proporción de ICE reguladas';
      return regulacion(req, res, data);
    }
    case 'calificacion': {
      data.indicator_name = 'Proporción de ICE calificadas';
      return calificacion(req, res, data);
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
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Inversión', format: 'money'},
          { name: 'Total Créditos', format: 'number'}
        ];

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

          let indicatorValue = total_investment / total_credits;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_investment, total_credits];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_investment, total_credits];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 3); // length of additional columns + indicator
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'money';
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const financiamientoBeneficiario = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Inversión', format: 'money'},
          { name: 'Total Beneficiarios', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_investment = 0;
          let total_beneficiaries = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];
              // console.log(program);
              if (program.investment)
                total_investment += Number(program.investment);

              if (program.beneficiaries) {
                total_beneficiaries += Number(program.beneficiaries);
              }
            }
          }

          let indicatorValue = total_investment / total_beneficiaries;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_investment, total_beneficiaries];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_investment, total_beneficiaries];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 3);
        data.institution_names = institutionNames;
        data.type = 'money';
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const financiamientoInstitucion = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Inversión', format: 'money'},
          { name: 'Total Estudiantes', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          const total_investment = reports[i].total_investment;
          const total_students = reports[i].total_students;
          let indicatorValue = total_investment / total_students;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_investment, total_students];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_investment, total_students];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.bar_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 3);
        data.institution_names = underscore.sample(institutionNames, 10);
        data.type = 'money';
        data.additional_columns = additionalColumns;
        // console.log(data.bar_chart_results, data.table_results);
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

const financiamientoFuentes = async (req, res, data) => {
  const formData = req.body;
  const source = formData.source;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Financiamiento', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_source_amount = 0;
          let selected_source_amount = 0;
          if (reports[i].funding_sources && reports[i].funding_sources instanceof Array) {
            // console.log(reports[i].funding_sources);
            for (let j = 0; j < reports[i].funding_sources.length; j++) {
              total_source_amount += Number(reports[i].funding_sources[j].amount);
              if (reports[i].funding_sources[j].source === source) {
                selected_source_amount = Number(reports[i].funding_sources[j].amount);
              }
            }
          }

          let indicatorValue = selected_source_amount / total_source_amount * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_source_amount];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_source_amount];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.source = source;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const variacionAnual = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
          let total_credits = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];

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

          let indicatorValue = total_credits;
          if (indicatorValue) {
            // console.log(indicatorValue);
            // indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        let variationResults = [];
        for (let i = 0; i < results.length - 1; i++) {
          const obj = { reported_year: Number(results[i].reported_year) + 1 };
          Object.keys(results[i]).forEach(key => {
            if (key !== 'reported_year') {
              if (results[i + 1][key]) {
                obj[key] = ((results[i + 1][key] - results[i][key]) / results[i][key] * 100).toFixed(2);
              } else {
                obj[key] = -100;
              }
            }
          });
          variationResults.push(obj);
        }

        data.line_chart_results = variationResults;
        data.table_results = tableResults(variationResults, institutionNames, 1);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        // console.log(data.line_chart_results, data.table_results);
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

const asignacionLugar = async (req, res, data) => {
  const formData = req.body;
  const place = formData.place;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Créditos', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let place_credits = 0;
          let total_credits = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];

              if (program.credit_pais) {
                if (program.credit_pais.new) {
                  total_credits += Number(program.credit_pais.new);
                  if (place === 'pais')
                    place_credits += Number(program.credit_pais.new);
                }

                if (program.credit_pais.old) {
                  total_credits += Number(program.credit_pais.old);
                  if (place === 'pais')
                    place_credits += Number(program.credit_pais.old);
                }
              }

              if (program.credit_exterior) {
                if (program.credit_exterior.new) {
                  total_credits += Number(program.credit_exterior.new);
                  if (place === 'exterior')
                    place_credits += Number(program.credit_exterior.new);
                }

                if (program.credit_exterior.old) {
                  total_credits += Number(program.credit_exterior.old);
                  if (place === 'exterior')
                    place_credits += Number(program.credit_exterior.old);
                }
              }
            }
          }

          let indicatorValue = place_credits / total_credits * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.bar_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 10);
        data.type = 'percentage';
        data.place = place;
        data.additional_columns = additionalColumns;
        // console.log(data.bar_chart_results, data.table_results);
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

const asignacionNivel = async (req, res, data) => {
  const formData = req.body;
  const level = formData.level;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Créditos', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let level_credits = 0;
          let total_credits = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];

              if (program.credit_pais) {
                if (program.credit_pais.new) {
                  total_credits += Number(program.credit_pais.new);
                  if (program.level === level)
                    level_credits += Number(program.credit_pais.new);
                }

                if (program.credit_pais.old) {
                  total_credits += Number(program.credit_pais.old);
                  if (program.level === level)
                    level_credits += Number(program.credit_pais.old);
                }
              }

              if (program.credit_exterior) {
                if (program.credit_exterior.new) {
                  total_credits += Number(program.credit_exterior.new);
                  if (program.level === level)
                    level_credits += Number(program.credit_exterior.new);
                }

                if (program.credit_exterior.old) {
                  total_credits += Number(program.credit_exterior.old);
                  if (program.level === level)
                    level_credits += Number(program.credit_exterior.old);
                }
              }
            }
          }

          let indicatorValue = level_credits / total_credits * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.bar_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 10);
        data.type = 'percentage';
        data.level = level;
        data.additional_columns = additionalColumns;
        // console.log(data.bar_chart_results, data.table_results);
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

const asignacionGenero = async (req, res, data) => {
  const formData = req.body;
  const sex = formData.sex;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Créditos', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_credits = reports[i].female_students + reports[i].male_students;
          let sex_credits = 0;
          if (sex === 'female') {
            sex_credits = reports[i].female_students;
          } else {
            sex_credits = reports[i].male_students;
          }
          let indicatorValue = sex_credits / total_credits * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.bar_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 10);
        data.type = 'percentage';
        data.sex = sex;
        data.additional_columns = additionalColumns;
        // console.log(data.bar_chart_results, data.table_results);
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

const asignacionNuevo = async (req, res, data) => {
  const formData = req.body;
  const place = formData.place;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Créditos', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let new_credits = 0;
          let total_credits = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];

              if (program.credit_pais && place === 'pais') {
                if (program.credit_pais.new) {
                  total_credits += Number(program.credit_pais.new);
                  new_credits += Number(program.credit_pais.new);
                }

                if (program.credit_pais.old)
                  total_credits += Number(program.credit_pais.old);
              }

              if (program.credit_exterior && place === 'exterior') {
                if (program.credit_exterior.new) {
                  total_credits += Number(program.credit_exterior.new);
                  new_credits += Number(program.credit_exterior.new);
                }

                if (program.credit_exterior.old)
                  total_credits += Number(program.credit_exterior.old);
              }
            }
          }

          let indicatorValue = new_credits / total_credits * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.bar_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 10);
        data.type = 'percentage';
        data.place = place;
        data.additional_columns = additionalColumns;
        // console.log(data.bar_chart_results, data.table_results);
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

const asignacionNuevoNivel = async (req, res, data) => {
  const formData = req.body;
  const place = formData.place;
  const level = formData.level;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Total Créditos', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let new_credits = 0;
          let total_credits = 0;
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];

              if (program.level === level) {
                if (program.credit_pais && place === 'pais') {
                  if (program.credit_pais.new) {
                    total_credits += Number(program.credit_pais.new);
                    new_credits += Number(program.credit_pais.new);
                  }

                  if (program.credit_pais.old)
                    total_credits += Number(program.credit_pais.old);
                }

                if (program.credit_exterior && place === 'exterior') {
                  if (program.credit_exterior.new) {
                    total_credits += Number(program.credit_exterior.new);
                    new_credits += Number(program.credit_exterior.new);
                  }

                  if (program.credit_exterior.old)
                    total_credits += Number(program.credit_exterior.old);
                }
              }
            }
          }

          let indicatorValue = new_credits / total_credits * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_credits];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.bar_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 10);
        data.type = 'percentage';
        data.place = place;
        data.level = level;
        data.additional_columns = additionalColumns;
        // console.log(data.bar_chart_results, data.table_results);
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

const variacionCartera = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
          let total_portfolio = 0;
          if (reports[i].current_portfolio && reports[i].current_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].current_portfolio.length; j++) {
              total_portfolio += Number(reports[i].current_portfolio[j].amount);
            }
          }
          if (reports[i].pastdue_portfolio && reports[i].pastdue_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].pastdue_portfolio.length; j++) {
              total_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
            }
          }
          if (reports[i].execution_portfolio && reports[i].execution_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].execution_portfolio.length; j++) {
              total_portfolio += Number(reports[i].execution_portfolio[j].amount);
            }
          }

          let indicatorValue = total_portfolio;
          if (indicatorValue) {
            // console.log(indicatorValue);
            // indicatorValue = indicatorValue.toFixed(2);
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

        let variationResults = [];
        for (let i = 0; i < results.length - 1; i++) {
          const obj = { reported_year: Number(results[i].reported_year) + 1 };
          Object.keys(results[i]).forEach(key => {
            if (key !== 'reported_year') {
              if (results[i + 1][key]) {
                obj[key] = ((results[i + 1][key] - results[i][key]) / results[i][key] * 100).toFixed(2);
              } else {
                obj[key] = -100;
              }
            }
          });
          variationResults.push(obj);
        }

        data.line_chart_results = variationResults;
        data.table_results = tableResults(variationResults, institutionNames);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVigenteNivel = async (req, res, data) => {
  const formData = req.body;
  const level = formData.level;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vigente', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let current_portfolio = 0;
          let level_portfolio = 0;
          if (reports[i].current_portfolio && reports[i].current_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].current_portfolio.length; j++) {
              current_portfolio += Number(reports[i].current_portfolio[j].amount);
              if (reports[i].current_portfolio[j].name === level + '_pais'
                || reports[i].current_portfolio[j].name === level + '_exterior')
                level_portfolio += Number(reports[i].current_portfolio[j].amount);
            }
          }

          let indicatorValue = level_portfolio / current_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, current_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, current_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.level = level;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVigenteLugar = async (req, res, data) => {
  const formData = req.body;
  const place = formData.place;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vigente', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let current_portfolio = 0;
          let place_portfolio = 0;
          if (reports[i].current_portfolio && reports[i].current_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].current_portfolio.length; j++) {
              current_portfolio += Number(reports[i].current_portfolio[j].amount);
              if (reports[i].current_portfolio[j].name === 'pregrado_' + place
                || reports[i].current_portfolio[j].name === 'posgrado_' + place)
                place_portfolio += Number(reports[i].current_portfolio[j].amount);
            }
          }

          let indicatorValue = place_portfolio / current_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, current_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, current_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.place = place;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVigenteGenero = async (req, res, data) => {
  const formData = req.body;
  const sex = formData.sex;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vigente', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_portfolio = reports[i].current_portfolio_pregrado_male + reports[i].current_portfolio_pregrado_female
            + reports[i].current_portfolio_posgrado_male + reports[i].current_portfolio_posgrado_female;
          let sex_portfolio = 0;
          if (sex === 'female') {
            sex_portfolio = reports[i].current_portfolio_pregrado_female + reports[i].current_portfolio_posgrado_female;
          } else {
            sex_portfolio = reports[i].current_portfolio_pregrado_male + reports[i].current_portfolio_posgrado_male;
          }
          let indicatorValue = sex_portfolio / total_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.sex = sex;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVencida = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vencida', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_portfolio = 0;
          let pastdue_portfolio = 0;
          if (reports[i].current_portfolio && reports[i].current_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].current_portfolio.length; j++) {
              total_portfolio += Number(reports[i].current_portfolio[j].amount);
            }
          }
          if (reports[i].pastdue_portfolio && reports[i].pastdue_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].pastdue_portfolio.length; j++) {
              total_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
              pastdue_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
            }
          }
          if (reports[i].execution_portfolio && reports[i].execution_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].execution_portfolio.length; j++) {
              total_portfolio += Number(reports[i].execution_portfolio[j].amount);
            }
          }

          let indicatorValue = pastdue_portfolio / total_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVencidaNivel = async (req, res, data) => {
  const formData = req.body;
  const level = formData.level;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vigente', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let pastdue_portfolio = 0;
          let level_portfolio = 0;
          if (reports[i].pastdue_portfolio && reports[i].pastdue_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].pastdue_portfolio.length; j++) {
              pastdue_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
              if (reports[i].pastdue_portfolio[j].name === level + '_pais'
                || reports[i].pastdue_portfolio[j].name === level + '_exterior')
                level_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
            }
          }

          let indicatorValue = level_portfolio / pastdue_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, pastdue_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, pastdue_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.level = level;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVencidaLugar = async (req, res, data) => {
  const formData = req.body;
  const place = formData.place;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vencida', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let pastdue_portfolio = 0;
          let place_portfolio = 0;
          if (reports[i].pastdue_portfolio && reports[i].pastdue_portfolio instanceof Array) {
            for (let j = 0; j < reports[i].pastdue_portfolio.length; j++) {
              pastdue_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
              if (reports[i].pastdue_portfolio[j].name === 'pregrado_' + place
                || reports[i].pastdue_portfolio[j].name === 'posgrado_' + place)
                place_portfolio += Number(reports[i].pastdue_portfolio[j].amount);
            }
          }

          let indicatorValue = place_portfolio / pastdue_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, pastdue_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, pastdue_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.place = place;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const carteraVencidaGenero = async (req, res, data) => {
  const formData = req.body;
  const sex = formData.sex;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        const additionalColumns = [
          { name: 'Cartera Vencida', format: 'money'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_portfolio = reports[i].pastdue_portfolio_pregrado_male + reports[i].pastdue_portfolio_pregrado_female
            + reports[i].pastdue_portfolio_posgrado_male + reports[i].pastdue_portfolio_posgrado_female;
          let sex_portfolio = 0;
          if (sex === 'female') {
            sex_portfolio = reports[i].pastdue_portfolio_pregrado_female + reports[i].pastdue_portfolio_posgrado_female;
          } else {
            sex_portfolio = reports[i].pastdue_portfolio_pregrado_male + reports[i].pastdue_portfolio_posgrado_male;
          }
          let indicatorValue = sex_portfolio / total_portfolio * 100;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_portfolio];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_portfolio];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 2);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'percentage';
        data.sex = sex;
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const empleadoBeneficiario = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const reportsSnapshot = await db.collection('reports')
        .where('status', '==', 'Aceptado')
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
        let employeesCache = {};
        let results = [];
        for (let i = formData.from_year; i <= formData.to_year; i++) {
          let result = { reported_year: Number(i) };
          results.push(result);
        }
        const additionalColumns = [
          { name: 'Total Beneficiarios', format: 'number'},
          { name: 'Total Empleados', format: 'number'}
        ];

        for (let i = 0; i < reports.length; i++) {
          let total_students = 0;
          let total_employees = 0;
          if (employeesCache[reports[i].user_id]) {
            total_employees = employeesCache[reports[i].user_id];
          } else {
            const usersSnapshot = await db.collection('users')
              .where('user_id', '==', reports[i].user_id)
              .get();
            try {
              if (usersSnapshot.size > 1) {
                console.log('Error: ', 'Duplicate user profile document');
                data.error = 'Error de información duplicada. Contacte al administrador';
              } else {
                const institution = usersSnapshot.docs[0].data();
                userCache[reports[i].user_id] = institution.name;
                employeesCache[reports[i].user_id] = Number(institution.employees);
                total_employees = Number(institution.employees);
              }
            } catch (error) {
              console.log("Error: ", error);
              data.error = "Error al consultar datos del usuario";
            }
          }
          if (reports[i].programs && reports[i].programs instanceof Array) {
            for (let j = 0; j < reports[i].programs.length; j++) {
              const program = reports[i].programs[j];
              if (program.beneficiaries)
                total_students += Number(program.beneficiaries);
            }
          }

          let indicatorValue = total_students / total_employees;
          if (indicatorValue) {
            // console.log(indicatorValue);
            indicatorValue = indicatorValue.toFixed(2);
            if (userCache[reports[i].user_id]) {
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_students, total_employees];
            } else {
              const userRecord = await admin.auth().getUser(reports[i].user_id);
              userCache[reports[i].user_id] = userRecord.displayName;
              results[reports[i].reported_year - formData.from_year][userCache[reports[i].user_id]] = [indicatorValue, total_students, total_employees];
            }
          }
        }

        let institutionNames = [];
        Object.keys(userCache).forEach(key => institutionNames.push(userCache[key]));

        data.line_chart_results = results;
        data.table_results = tableResults(results, institutionNames, 3);
        data.institution_names = underscore.sample(institutionNames, 5);
        data.type = 'number';
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const plataformaTecnologica = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const usersSnapshot = await db.collection('users')
        .get();
      if (usersSnapshot.empty) {
        console.log('No documents found.');
        data.warning = 'No hay datos reportados en el periodo seleccionado.';
      } else {
        let users = usersSnapshot.docs.map(doc => doc.data());
        // console.log(reports);
        let results = [];
        for (let i = 0; i < users.length; i++) {
          if (users[i].name && users[i].has_platform) {
            let result = {
              institution_name: users[i].name,
              indicators: [{reported_year: '¿Cuenta con Plataforma Tecnológica?', values: [users[i].has_platform]}]
            };
            results.push(result);
          }
        }

        // data.line_chart_results = results;
        data.table_results = results;
        // data.institution_names = ['si', 'no'];
        // data.type = 'percentage';
        // console.log(data.line_chart_results, data.table_results);
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

const regulacion = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const usersSnapshot = await db.collection('users')
        .get();
      if (usersSnapshot.empty) {
        console.log('No documents found.');
        data.warning = 'No hay datos reportados en el periodo seleccionado.';
      } else {
        let users = usersSnapshot.docs.map(doc => doc.data());
        // console.log(reports);
        let results = [];
        for (let i = 0; i < users.length; i++) {
          if (users[i].name && users[i].regulated) {
            let result = {
              institution_name: users[i].name,
              indicators: [{reported_year: '¿Está la ICE regulada?', values: [users[i].regulated, users[i].regulating_entity]}]
            };
            results.push(result);
          }
        }
        const additionalColumns = [
          { name: 'Entidad Reguladora', format: 'text'}
        ];

        // data.line_chart_results = results;
        data.table_results = results;
        // data.institution_names = ['si', 'no'];
        // data.type = 'percentage';
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const calificacion = async (req, res, data) => {
  const formData = req.body;
  const years = formData.to_year - formData.from_year + 1;
  if (years >= 0 && years <= 10) {
    try {
      const usersSnapshot = await db.collection('users')
        .get();
      if (usersSnapshot.empty) {
        console.log('No documents found.');
        data.warning = 'No hay datos reportados en el periodo seleccionado.';
      } else {
        let users = usersSnapshot.docs.map(doc => doc.data());
        // console.log(reports);
        let results = [];
        for (let i = 0; i < users.length; i++) {
          if (users[i].name && users[i].credit_rating) {
            let result = {
              institution_name: users[i].name,
              indicators: [{reported_year: '¿Cuenta la ICE con calificación crediticia?',
                values: [users[i].credit_rating, users[i].rating_agency]}]
            };
            results.push(result);
          }
        }
        const additionalColumns = [
          { name: 'Agencia Calificadora', format: 'text'}
        ];

        // data.line_chart_results = results;
        data.table_results = results;
        // data.institution_names = ['si', 'no'];
        // data.type = 'percentage';
        data.additional_columns = additionalColumns;
        // console.log(data.line_chart_results, data.table_results);
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

const tableResults = (chartResults, institutionNames, indicatorsLength) => {
  let tableResults = [];
  for (let i = 0; i < institutionNames.length; i++) {
    let result = { institution_name: institutionNames[i], indicators: [] };
    for (let j = 0; j < chartResults.length; j++) {
      let indicator = { reported_year: chartResults[j].reported_year };
      const indicatorValues = chartResults[j][result.institution_name];
      indicator.values = [];
      for (let k = 0; k < indicatorsLength; k++) {
        indicator.values.push(null);
      }
      if (indicatorValues) {
        indicator.values = indicatorValues;
      }
      console.log(indicator);
      result.indicators.push(indicator);
    }
    tableResults.push(result);
  }

  return tableResults;
};