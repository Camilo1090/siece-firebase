const countries = require('i18n-iso-countries');
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
      topStatistics(institutions, data);
      investmentByCountry(institutions, data);
      return investmentByInstitution(institutions, data, res).then(() => {
        data.investment_by_institution.sort((a, b) => {
          if (a.amount > b.amount)
            return -1;
          return 1;
        });
        data.investment_by_institution = data.investment_by_institution.slice(0, 4);
        if (data.investment_by_institution.length > 0) {
          const maxAmount = data.investment_by_institution[0].amount;
          data.investment_by_institution.forEach((item) => {
            item.progress = item.amount / maxAmount * 100;
            item.amount = item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
          });
        }
        console.log(data);
        return res.render('index', data);
      }).catch(err => {
        console.log('Error getting users', err);
        data.error = 'Error al consultar la base de datos';
        return res.render('index', data);
      });
    })
    .catch(err => {
      console.log('Error getting documents', err);
      data.error = 'Error al consultar la base de datos';
      return res.render('index', data);
    });
};

function topStatistics(institutions, data) {
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
}

function investmentByCountry(institutions, data) {
  let investments = [];
  for (let i = 0; i < institutions.length; i++) {
    if (institutions[i].programs) {
      let investment = investments.find((item) => item.country_code === institutions[i].country);
      if (!investment) {
        investment = {
          country_code: institutions[i].country,
          country_name: countries.getName(institutions[i].country, 'es'),
          amount: 0
        };
        investments.push(investment);
      }
      for (let j = 0; j < institutions[i].programs.length; j++) {
        investment.amount += Number(institutions[i].programs[j].investment);
      }
    }
  }
  investments.sort((a, b) => {
    if (a.amount > b.amount)
      return -1;
    return 1;
  });
  data.investment_by_country = investments.slice(0, 15);
}

function investmentByInstitution(institutions, data, res) {
  data.investment_by_institution = [];
  let promiseChain = Promise.resolve();
  for (let i = 0; i < institutions.length; i++) {
    if (institutions[i].programs && institutions[i].programs.length > 0) {
      let amount = 0;
      for (let j = 0; j < institutions[i].programs.length; j++) {
        amount += Number(institutions[i].programs[j].investment);
      }
      const makeNextPromise = (institution, amount, data) => () => {
        return admin.auth().getUser(institution.user_id)
          .then(userRecord => {
            let investment = {
              user_id: institution.user_id,
              institution_name: userRecord.displayName,
              amount: amount
            };
            return data.investment_by_institution.push(investment);
          })
          .catch(err => {
            console.log('Error getting user', err);
            data.error = 'Error al consultar la base de datos';
            return res.render('index', data);
          });
      };

      promiseChain = promiseChain.then(makeNextPromise(institutions[i], amount, data));
    }
  }

  return promiseChain;
}