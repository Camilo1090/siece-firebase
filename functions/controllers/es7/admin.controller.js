const admin = require('firebase-admin');
const db = admin.firestore();


exports.getReports = async (req, res) => {
  let data = { user: req.user, is_admin: req.is_admin };
  if (req.data)
    data = req.data;
  const formData = req.body;

  let reportedYear = (new Date()).getFullYear() - 1;
  if (formData.reported_year)
    reportedYear = Number(formData.reported_year);
  data.reported_year = reportedYear;

  try {
    const reportsSnapshot = await db.collection('reports')
      .where('reported_year', '==', reportedYear)
      // .where('status', '==', 'finalizado')
      .get();

    data.reports = await Promise.all(
      reportsSnapshot.docs.map(
        async (doc) => {
          let report = doc.data();
          report = {
            institution_name: await getInstitutionName(report.user_id),
            user_id: report.user_id,
            reported_year: report.reported_year,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at,
            reviewable: report.status !== 'Incompleto'
          };
          return report;
        }));

    console.log('Reportes: ', data.reports);
    return res.render('admin', data);
  } catch (error) {
    console.log('Error: ', error);
    data.error = 'Error al consultar la base de datos.';
    return res.render('admin', data);
  }
};

exports.reviewReport = async (req, res) => {
  let data = { user: req.user, is_admin: req.is_admin };
  const params = req.query;

  try {
    if (params.reported_year && params.user) {
      const reportsSnapshot = await db.collection('reports')
        .where('user_id', '==', params.user)
        .where('reported_year', '==', Number(params.reported_year))
        .get();
      if (reportsSnapshot.size === 1) {
        data.report = reportsSnapshot.docs[0].data();
        if (data.report.status === 'Incompleto') {
          data.error = 'Reporte incompleto no enviado para revisión aún.';
        } else {
          const usersSnapshot = await db.collection('users')
            .where('user_id', '==', params.user)
            .get();
          data.report.institution_name = usersSnapshot.docs[0].data().name;
        }
      } else {
        data.error = 'Reporte duplicado o inexistente.';
      }
    } else {
      data.error = 'Parametros incorrectos.';
    }

    return res.render('review-report', data);
  } catch (error) {
    console.log('Error: ', error);
    if (!data.error)
      data.error = 'Error al consultar la base de datos.';
    return res.render('review-report', data);
  }
};

exports.acceptOrDeclineReport = async (req, res) => {
  let data = { user: req.user, is_admin: req.is_admin };
  const params = req.query;
  const formData = req.body;

  try {
    if (params.reported_year && params.user) {
      const reportsSnapshot = await db.collection('reports')
        .where('user_id', '==', params.user)
        .where('reported_year', '==', Number(params.reported_year))
        .get();
      if (reportsSnapshot.size === 1) {
        let report = reportsSnapshot.docs[0].data();
        if (Number(formData.accepted) === 1) {
          console.log('accepted: ', formData.accepted);
          if (report.status !== 'Incompleto') {
            report.status = 'Aceptado';
            const result = await reportsSnapshot.docs[0].ref.set(report, {merge: true});
            console.log('Report accepted: ', result);
            data.success = 'Reporte aceptado exitosamente.';
          } else {
            data.error = 'Reporte ya aceptado o no enviado para revisión aún.';
          }
        } else {
          console.log('accepted: ', formData.accepted);
          if (report.status !== 'Incompleto') {
            report.status = 'Incompleto';
            const result = await reportsSnapshot.docs[0].ref.set(report, {merge: true});
            console.log('Report rejected: ', result);
            data.success = 'Reporte rechazado exitosamente.';
          } else {
            data.error = 'Reporte ya aceptado o no enviado para revisión aún.';
          }
        }
        return res.redirect('/admin');
      } else {
        data.error = 'Reporte duplicado o inexistente.';
      }
    } else {
      data.error = 'Parametros incorrectos.';
    }

    return res.render('review-report', data);
  } catch (error) {
    console.log('Error: ', error);
    if (!data.error)
      data.error = 'Error al consultar la base de datos.';
    return res.render('review-report', data);
  }
};

const getInstitutionName = async (userId) => {
  const querySnapshot = await db.collection('users')
    .where('user_id', '==', userId)
    .get();
  return querySnapshot.docs[0].data().name;
};