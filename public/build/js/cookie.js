// async function checkCookie() {
//   // Checks if it's likely that there is a signed-in Firebase user and the session cookie expired.
//   // In that case we'll hide the body of the page until it will be reloaded after the cookie has been set.
//   const hasSessionCookie = document.cookie.indexOf('__session=') !== -1;
//   const isProbablySignedInFirebase = typeof Object.keys(localStorage)
//     .find((key) => {
//       return key.startsWith('firebase:authUser')
//     }) !== 'undefined';
//   if (!hasSessionCookie && isProbablySignedInFirebase) {
//     const token = await firebase.auth().currentUser.getIdToken(true);
//     console.log('tokennnn: ', token);
//   }
// }
// checkCookie();
// document.addEventListener('DOMContentLoaded', function() {
  // Make sure the Firebase ID Token is always passed as a cookie.
  // firebase.auth().addAuthTokenListener(function (idToken) {
  //   const hadSessionCookie = document.cookie.indexOf('__session=') !== -1;
  //   document.cookie = '__session=' + idToken + ';max-age=' + (idToken ? 10 : 0);
  //   // console.log('token: ' + idToken, hadSessionCookie);
  //   // console.log(document.cookie);
  //   // If there is a change in the auth state compared to what's in the session cookie we'll reload after setting the cookie.
  //   if ((!hadSessionCookie && idToken) || (hadSessionCookie && !idToken)) {
  //     window.location.replace('/index');
  //   }
  // });

//   firebase.auth().onAuthStateChanged(async function (user) {
//     const hadSessionCookie = document.cookie.indexOf('__session=') !== -1;
//     document.cookie = '__session=null;max-age=0';
//     if (user) {
//       const idToken = await user.getIdToken();
//       document.cookie = '__session=' + idToken + ';max-age=3630';
//       console.log('tiki1');
//     }
//     console.log(document.cookie, hadSessionCookie);
//     // If there is a change in the auth state compared to what's in the session cookie we'll reload after setting the cookie.
//     if ((!hadSessionCookie && user) || (hadSessionCookie && !user)) {
//       window.location.replace('/index');
//       console.log('tiki2');
//     }
//   });
// });

function logout() {
  document.cookie = '__session=null;max-age=0';
  window.location.replace('/index');
}