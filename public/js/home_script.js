let nursesData = [];

async function loadNurses() {
  try {
    const response = await fetch('data/cards.json');
    const data = await response.json();
    nursesData = data.nurses;
    displayNurses(nursesData);
  } catch (error) {
    console.error('Error loading nurses data:', error);
  }
}

function displayNurses(nurses) {
  const container = document.getElementById('nurses-container');
  container.innerHTML = ''; 

  const nursesToShow = nurses.slice(0, 4);

  nursesToShow.forEach(nurse => {
    const nurseCard = document.createElement('div');
    nurseCard.className = 'doctor-card';
    
    nurseCard.innerHTML = `
      <div class="doctor-img">
        <img src="${nurse.image}" alt="${nurse.name}">
      </div>
      <h3>${nurse.name}</h3>
      <p class="designation">${nurse.role}</p>
      <div class="rating">
        ⭐ ${nurse.rating} Rating
      </div>
      <p style="color: #666; font-size: 14px; margin-top: 8px;">${nurse.distance}</p>
      <button class="book-btn" onclick='bookThisNurse(${JSON.stringify(nurse)})'>Book Appointment</button>
    `;
    
    container.appendChild(nurseCard);
  });
}

function searchNurses() {
  const pincode = document.querySelector('.search-box input[type="text"]').value.trim();
  const timeSlot = document.querySelector('.search-box select').value;

  if (!pincode) {
    alert('Please enter your Area/Pin Code');
    return;
  }

  sessionStorage.setItem('searchPincode', pincode);
  sessionStorage.setItem('searchTimeSlot', timeSlot);

  // Redirect to nurses page with search parameters
  window.location.href = `nurses.html?pincode=${encodeURIComponent(pincode)}&time=${encodeURIComponent(timeSlot)}`;
}

// Newsletter subscription
function subscribeNewsletter() {
  const emailInput = document.querySelector('.newsletter input[type="email"]');
  const email = emailInput.value.trim();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    alert('Please enter your email address');
    return;
  }

  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  // Store subscription (in a real app, this would send to a server)
  let subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
  
  if (subscribers.includes(email)) {
    alert('This email is already subscribed to our newsletter!');
    return;
  }

  subscribers.push(email);
  localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));

  alert('Thank you for subscribing to our newsletter!');
  emailInput.value = '';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load nurses data
  loadNurses();

  // Add event listener to search button
  const searchButton = document.querySelector('.search-box button');
  if (searchButton) {
    searchButton.addEventListener('click', searchNurses);
  }

  // Add event listener for Enter key in search input
  const searchInput = document.querySelector('.search-box input[type="text"]');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchNurses();
      }
    });
  }

  // Add event listener to newsletter subscribe button
  const subscribeButton = document.querySelector('.newsletter button');
  if (subscribeButton) {
    subscribeButton.addEventListener('click', subscribeNewsletter);
  }

  // Add event listener for Enter key in newsletter input
  const newsletterInput = document.querySelector('.newsletter input[type="email"]');
  if (newsletterInput) {
    newsletterInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        subscribeNewsletter();
      }
    });
  }
});