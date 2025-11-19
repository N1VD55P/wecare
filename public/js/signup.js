// public/js/signup.js
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var roleButtons = document.querySelectorAll('.role-btn');
    var roleInput = document.getElementById('roleInput');
    if (roleButtons && roleButtons.length > 0) {
      var defaultRole = (roleInput && roleInput.value) ? roleInput.value : 'patient';
      roleButtons.forEach(function (btn) {
        if (btn.dataset.role === defaultRole) btn.classList.add('active');
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          roleButtons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          if (roleInput) roleInput.value = btn.dataset.role;
        });
      });
    }

    // Close button handling (reuse login close behavior)
    var closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        try { if (window.history && window.history.length > 1) window.history.back(); else window.location.href = '/'; } catch (err) { window.location.href = '/'; }
      });
    }
  });
})();
