// public/js/profile.js
document.addEventListener('DOMContentLoaded', function () {
  // simple client-side validation could go here
  var form = document.querySelector('form[action="/profile"]');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    // example: ensure name not empty
    var name = document.getElementById('name');
    if (name && name.value.trim().length === 0) {
      e.preventDefault();
      alert('Please provide your full name');
    }
  });
});
