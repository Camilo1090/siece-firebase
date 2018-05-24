const admin = require('firebase-admin');
let db = admin.firestore();

exports.getIndex = (req, res) => {
  let data = {};
  if (req.user)
    data.user = req.user;
  const reportedYear =
    '2016';
    // ((new Date()).getFullYear() - 1).toString();
  data.reported_year = reportedYear;
  db.collection('institutions')
    .where('reported_year', '==', reportedYear)
    // .where('status', '==', 'finalizado')
    .get()
    .then(querySnapshot => {
      if (querySnapshot.empty) {
        console.log('No documents found.');
      }
      let institutions = querySnapshot.docs.map(doc => doc.data());
      // console.log(institutions);
      data.forms = institutions.length;
      let totalBeneficiaries = 0;
      let totalFemale = 0;
      let totalMale = 0;
      let totalInvestment = 0;
      for (let i = 0; i < institutions.length; i++) {
        if (institutions[i].programs) {
          for (let j = 0; j < institutions[i].programs.length; j++) {
            totalBeneficiaries += Number(institutions[i].programs[j].beneficiaries);
            totalInvestment += Number(institutions[i].programs[j].investment);
          }
          totalFemale += Number(institutions[i].female_students);
          totalMale += Number(institutions[i].male_students);
        }
      }
      data.total_beneficiaries = totalBeneficiaries;
      data.percentage_female = (totalFemale / totalBeneficiaries * 100).toFixed(2);
      data.percentage_male = (totalMale / totalBeneficiaries * 100).toFixed(2);
      data.total_investment = totalInvestment.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      console.log(data);

      return res.render('index', data);
    })
    .catch(err => {
      console.log('Error getting documents', err);
      data.error = 'Error al consultar la base de datos';
      return res.render('index', data);
    });
};