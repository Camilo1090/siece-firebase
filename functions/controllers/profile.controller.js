const admin = require('firebase-admin');
let db = admin.firestore();

exports.getProfile = (req, res) => {
  return res.render('profile', { user: req.user });
};

exports.saveProfile = (req, res) => {
  let params = req.body;
  let data = {};
  admin.auth().updateUser(req.user.uid, {
    displayName: params.institution_name
  }).then(userRecord => {
    data.success = "Datos actualizados correctamente";
    data.user = userRecord;
    console.log("Successfully updated user", userRecord.toJSON());
    return res.render('profile', data);
  }).catch(error => {
    data.error = "Error al guardar los datos";
    data.user = req.user;
    console.log("Error updating user:", error);
    return res.render('profile', data);
  });
};