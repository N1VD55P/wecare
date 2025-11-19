// public/js/login.js
// Handle close (X) button on the login page.
(function () {
  function closeLogin() {
    // If there is a history to go back to, use it. Otherwise, go to home page.
    try {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    } catch (e) {
      // Fallback
      window.location.href = '/';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeLogin();
      });
    }

    // Role selection buttons (patient / nurse)
    var roleButtons = document.querySelectorAll('.role-btn');
    var roleInput = document.getElementById('roleInput');
    if (roleButtons && roleButtons.length > 0) {
      // Ensure default selection (if roleInput has a value use it, otherwise default to 'patient')
      var defaultRole = (roleInput && roleInput.value) ? roleInput.value : 'patient';
      roleButtons.forEach(function (btn) {
        if (btn.dataset.role === defaultRole) btn.classList.add('active');
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          var r = btn.dataset.role;
          // mark active
          roleButtons.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          if (roleInput) roleInput.value = r;
        });
      });
    }

    // Allow pressing Escape to close as well
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeLogin();
      }
    });
  });
})();
