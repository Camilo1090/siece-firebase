'use strict';const admin = require('firebase-admin');
let db = admin.firestore();

exports.getProfile = (req, res) => {
  let data = { user: req.user };
  let institutionQuery = db.collection('users').
  where('user_id', '==', req.user.uid);
  institutionQuery.get().
  then(querySnapshot => {
    if (querySnapshot.empty) {
      data.warning = 'Debe completar todos los datos del perfil antes de poder reportar datos';
    } else if (querySnapshot.size > 1) {
      data.error = 'Error de información duplicada. Contacte al administrador';
    } else {
      data.institution = querySnapshot.docs[0].data();
    }
    return res.render('profile', data);
  }).
  catch(error => {
    data.error = "Error al consultar datos del usuario";
    console.log("Error getting user:", error);
    return res.render('profile', data);
  });
};

exports.saveProfile = (req, res) => {
  let formData = req.body;
  let data = { user: req.user };
  let institution = { user_id: req.user.uid };
  data.institution = institution;
  let institutionQuery = db.collection('users').where('user_id', '==', req.user.uid);
  institutionQuery.get().
  then(querySnapshot => {
    if (querySnapshot.size > 1) {
      data.error = 'Error de información duplicada. Contacte al administrador';
      return Promise.reject(new Error('Duplicate user profile document'));
    } else {
      if (validateFormData(formData)) {
        institution.name = formData.institution_name;

        let type = {};
        type.name = formData.type;
        formData.type_other ? type.other = formData.type_other : type.other = '';
        institution.type = type;

        let character = {};
        character.name = formData.character;
        formData.character_other ? character.other = formData.character_other : character.other = '';
        institution.character = character;

        institution.country = formData.country;

        institution.foundation_year = Number(formData.foundation_year);

        institution.representative_name = formData.representative_name;

        institution.representative_position = formData.representative_position;

        institution.employees = Number(formData.employees);

        institution.has_platform = formData.has_platform;

        institution.platform_ownership = formData.platform_ownership;

        const newProfile = querySnapshot.empty;
        if (newProfile) {
          institution.created_at = new Date().toUTCString();
          institution.updated_at = new Date().toUTCString();
          return db.collection('users').doc().set(institution);
        } else {
          institution.updated_at = new Date().toUTCString();
          let institutionRef = querySnapshot.docs[0].ref;
          return institutionRef.set(institution, { merge: true });
        }
      } else {
        data.error = 'Falló la validación del formulario';
        return Promise.reject(new Error('Form validation failed'));
      }
    }
  }).
  then(result => {
    console.log('Data saved: ', result);
    data.success = 'Datos guardados exitosamente';
    return Promise.resolve();
  }).
  then(() => {
    return admin.auth().updateUser(req.user.uid, {
      displayName: formData.institution_name });

  }).
  then(userRecord => {
    console.log('Successfully updated user: ', userRecord.uid);
    data.user = userRecord;
    return res.render('profile', data);
  }).
  catch(error => {
    console.log('Error: ', error);
    if (!data.error)
    data.error = 'Error al consultar la base de datos. Contacte al administrador';
    return res.render('profile', data);
  });
};

function validateFormData(formData) {
  if (!formData.institution_name) {
    return false;
  }

  if (!formData.type) {
    return false;
  }

  if (formData.type === 'otra' && !formData.type_other) {
    return false;
  }

  if (!formData.character) {
    return false;
  }

  if (formData.character === 'otra' && !formData.character_other) {
    return false;
  }

  if (!formData.country) {
    return false;
  }

  if (!formData.foundation_year) {
    return false;
  }

  if (!formData.representative_name) {
    return false;
  }
  if (!formData.representative_position) {
    return false;
  }

  if (!formData.employees) {
    return false;
  }

  if (!formData.has_platform) {
    return false;
  }

  if (formData.has_platform === 'si' && !formData.platform_ownership) {
    return false;
  }

  return true;
}