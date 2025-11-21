
let nursesData = [];
let filteredNurses = [];

async function loadNurses() {
  try {
    // Prefer server-provided data (injected into window.__NURSES__), otherwise fall back to local JSON
    if (window && Array.isArray(window.__NURSES__) && window.__NURSES__.length > 0) {
      nursesData = window.__NURSES__;
    } else {
      const response = await fetch('data/cards.json');
      const data = await response.json();
      nursesData = data.nurses;
    }
    filteredNurses = [...nursesData];
    
    const urlParams = new URLSearchParams(window.location.search);
    const pincode = urlParams.get('pincode');
    const timeSlot = urlParams.get('time');
    
    if (pincode) {
      displaySearchInfo(pincode, timeSlot);
    }
    
    displayNurses(filteredNurses);
  } catch (error) {
    console.error('Error loading nurses data:', error);
  }
}

function displaySearchInfo(pincode, timeSlot) {
  const searchInfoDiv = document.getElementById('search-info');
  if (searchInfoDiv) {
    searchInfoDiv.innerHTML = `
      <div style="background: #f0f7ff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
        <p style="color: #1a3d7c; font-weight: bold;">
          Showing nurses near: <span style="color: #333;">${pincode}</span> | 
          Time Slot: <span style="color: #333;">${timeSlot}</span>
        </p>
      </div>
    `;
  }
}

function displayNurses(nurses) {
  const container = document.getElementById('nurses-container');
  
  if (!container) {
    console.error('Nurses container not found');
    return;
  }
  
  container.innerHTML = '';

  if (nurses.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No nurses found matching your criteria.</p>';
    return;
  }

  nurses.forEach(nurse => {
    const nurseCard = document.createElement('div');
    nurseCard.className = 'nurse-card';
    
    nurseCard.innerHTML = `
      <div class="nurse-image">
        <img src="${nurse.image}" alt="${nurse.name}">
      </div>
      <div class="nurse-details">
  <h3 class="nurse-name">${nurse.name}</h3>
  <p class="nurse-role">${nurse.specialization || nurse.role || ''}</p>
        <div class="nurse-info">
          <span class="nurse-rating">⭐ ${nurse.rating}</span>
          <span class="nurse-distance">📍 ${nurse.distance}</span>
        </div>
        <button class="book-btn" onclick='bookNurse(${JSON.stringify(nurse)})'>Book Appointment</button>
      </div>
    `;
    
    container.appendChild(nurseCard);
  });
}

function bookNurse(nurse) {
  sessionStorage.setItem('selectedNurse', JSON.stringify(nurse));
  // Redirect to server booking route with nurse id when available
  const nurseId = nurse.id || nurse._id || nurse._id_str || nurse.name;
  window.location.href = `/booking?nurse=${encodeURIComponent(nurseId)}`;
}

function filterNurses() {
  const searchInput = document.getElementById('search-input');
  const filterRole = document.getElementById('filter-role');
  const filterRating = document.getElementById('filter-rating');
  
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const roleFilter = filterRole ? filterRole.value : 'all';
  const ratingFilter = filterRating ? parseFloat(filterRating.value) : 0;
  
  filteredNurses = nursesData.filter(nurse => {
    const specialization = (nurse.specialization || nurse.role || '').toString().toLowerCase();
    const matchesSearch = (nurse.name && nurse.name.toLowerCase().includes(searchTerm)) || 
                         specialization.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || specialization === roleFilter;
    const matchesRating = nurse.rating >= ratingFilter;
    
    return matchesSearch && matchesRole && matchesRating;
  });
  
  displayNurses(filteredNurses);
}

function sortNurses(criteria) {
  switch(criteria) {
    case 'rating-high':
      filteredNurses.sort((a, b) => b.rating - a.rating);
      break;
    case 'rating-low':
      filteredNurses.sort((a, b) => a.rating - b.rating);
      break;
    case 'distance':
      filteredNurses.sort((a, b) => {
        const distA = parseFloat(a.distance);
        const distB = parseFloat(b.distance);
        return distA - distB;
      });
      break;
    case 'name':
      filteredNurses.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      filteredNurses = [...nursesData];
  }
  
  displayNurses(filteredNurses);
}

function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const filterRole = document.getElementById('filter-role');
  const filterRating = document.getElementById('filter-rating');
  const sortSelect = document.getElementById('sort-select');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterNurses);
  }
  
  if (filterRole) {
    filterRole.addEventListener('change', filterNurses);
  }
  
  if (filterRating) {
    filterRating.addEventListener('change', filterNurses);
  }
  
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => sortNurses(e.target.value));
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadNurses();
  setupFilters();
});