let selectedNurse = null;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

function loadSelectedNurse() {
  const urlParams = new URLSearchParams(window.location.search);
  const nurseName = urlParams.get('nurse');
  
  if (nurseName) {
    fetch('data/cards.json')
      .then(response => response.json())
      .then(data => {
        selectedNurse = data.nurses.find(n => n.name === nurseName);
        if (selectedNurse) {
          updateNurseInfo();
        }
      })
      .catch(error => console.error('Error loading nurse data:', error));
  } else {
    const storedNurse = sessionStorage.getItem('selectedNurse');
    if (storedNurse) {
      selectedNurse = JSON.parse(storedNurse);
      updateNurseInfo();
    }
  }
}

function updateNurseInfo() {
  if (!selectedNurse) return;
  
  const nurseInfoDiv = document.querySelector('.nurse-info');
  nurseInfoDiv.innerHTML = `
    <div class="nurse-name">${selectedNurse.name.toUpperCase()}</div>
    <div class="nurse-details">${selectedNurse.role}</div>
    <div class="nurse-rating">ratings ${selectedNurse.rating} ⭐</div>
    <div class="nurse-details">${selectedNurse.distance}</div>
    <div class="nurse-price" style="color: #1a3d7c; font-weight: bold; margin-top: 5px; font-size: 16px;">${selectedNurse.price}</div>
  `;
  updateBookingSummary();
}

const servicePrices = {
  'Consultation': 500,
  'Home visit': 1200,
  'Emergency': 2000
};

function setupServiceSelection() {
  const serviceCards = document.querySelectorAll('.service-card');
  
  serviceCards.forEach(card => {
    card.addEventListener('click', function() {
      serviceCards.forEach(c => c.style.border = '2px solid #e9ecef');
      
      this.style.border = '2px solid #1a3d7c';
      this.style.background = '#f0f7ff';
      
      const serviceTitle = this.querySelector('.service-title').textContent;
      const servicePrice = servicePrices[serviceTitle];
      
      selectedService = {
        name: serviceTitle,
        price: servicePrice
      };
      
      updateBookingSummary();
      updateProceedButton();
    });
  });
}

function setupDateTimeSelection() {
  const dateInput = document.querySelector('.date-input');
  const timeInput = document.querySelector('.time-input');
  
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
  
  dateInput.addEventListener('change', function() {
    selectedDate = this.value;
    updateBookingSummary();
  });
  
  timeInput.addEventListener('change', function() {
    selectedTime = this.value;
    updateBookingSummary();
  });
}

function updateBookingSummary() {
  const summaryDetails = document.querySelector('.summary-details');
  
  if (!summaryDetails) return;
  
  const serviceName = selectedService ? selectedService.name : 'Not selected';
  const dateText = selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not selected';
  const timeText = selectedTime ? selectedTime : 'Not selected';
  const nurseName = selectedNurse ? selectedNurse.name : 'Not selected';
  const nursePrice = selectedNurse ? selectedNurse.price : 'N/A';
  const totalPrice = selectedService ? selectedService.price : 0;
  
  summaryDetails.innerHTML = `
    <div class="summary-row">
      <span>Service</span>
      <span>${serviceName}</span>
    </div>
    <div class="summary-row">
      <span>Date</span>
      <span>${dateText}</span>
    </div>
    <div class="summary-row">
      <span>Time</span>
      <span>${timeText}</span>
    </div>
    <div class="summary-row">
      <span>Nurse</span>
      <span>${nurseName}</span>
    </div>
    <div class="summary-row">
      <span>Nurse Rate</span>
      <span style="color: #1a3d7c; font-weight: bold;">${nursePrice}</span>
    </div>
  `;
  
  const summaryTotal = document.querySelector('.summary-total');
  if (summaryTotal) {
    summaryTotal.innerHTML = `
      <span>Total</span>
      <span>Rs. ${totalPrice}</span>
    `;
  }
}

function updateProceedButton() {
  const proceedBtn = document.querySelector('.proceed-btn');
  if (proceedBtn && selectedService) {
    proceedBtn.textContent = `Proceed to pay Rs ${selectedService.price}`;
  }
}

function setupProceedButton() {
  const proceedBtn = document.querySelector('.proceed-btn');
  
  proceedBtn.addEventListener('click', function() {
    if (!selectedNurse) {
      alert('Please select a nurse');
      return;
    }
    
    if (!selectedService) {
      alert('Please select a service type');
      return;
    }
    
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }
    
    if (!selectedTime) {
      alert('Please select a time');
      return;
    }
    
    const paymentButtons = document.querySelectorAll('.payment-btn');
    let selectedPayment = null;
    
    paymentButtons.forEach(btn => {
      if (btn.style.background === 'rgb(26, 61, 124)' || btn.style.background === '#1a3d7c') {
        selectedPayment = btn.textContent;
      }
    });
    
    if (!selectedPayment) {
      alert('Please select a payment method');
      return;
    }
    
    const appointment = {
      nurse: selectedNurse,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      payment: selectedPayment,
      insurance: document.getElementById('insurance').checked,
      bookingDate: new Date().toISOString()
    };
    
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    
    window.location.href = 'index.html';
  });
}

function setupPaymentSelection() {
  const paymentButtons = document.querySelectorAll('.payment-btn');
  
  paymentButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      paymentButtons.forEach(b => {
        b.style.background = 'white';
        b.style.color = '#333';
      });
      
      this.style.background = '#1a3d7c';
      this.style.color = 'white';
    });
  });
}

function loadUserAppointments() {
  const appointmentsContainer = document.querySelector('.appointments-section');
  const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  
  if (appointments.length === 0) {
    appointmentsContainer.innerHTML = '<h2>Your Appointments</h2><p style="color: #666;">No appointments yet</p>';
    return;
  }
  
  let appointmentsHTML = '<h2>Your Appointments</h2>';
  
  const recentAppointments = appointments.slice(-3).reverse();
  
  recentAppointments.forEach((apt, index) => {
    const appointmentDate = new Date(apt.date + 'T' + apt.time);
    const isPast = appointmentDate < new Date();
    
    appointmentsHTML += `
      <div class="appointment-card">
        <div class="appointment-avatar">
          <img src="${apt.nurse.image}" alt="${apt.nurse.name}" class="avatar-img">
        </div>
        <div class="appointment-info">
          <div class="appointment-name">${apt.nurse.name}</div>
          <div class="appointment-time">${new Date(apt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}, ${apt.time}</div>
        </div>
        <div class="appointment-actions">
          ${isPast ? 
            '<button class="completed-btn">Completed</button>' : 
            '<button class="cancel-btn" onclick="cancelAppointment(' + (appointments.length - 1 - index) + ')">Cancel</button><button class="reschedule-btn">Reschedule</button>'
          }
        </div>
      </div>
    `;
  });
  
  appointmentsContainer.innerHTML = appointmentsHTML;
}

function cancelAppointment(index) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    let appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.splice(index, 1);
    localStorage.setItem('appointments', JSON.stringify(appointments));
    loadUserAppointments();
    alert('Appointment cancelled successfully');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadSelectedNurse();
  setupServiceSelection();
  setupDateTimeSelection();
  setupProceedButton();
  setupPaymentSelection();
  loadUserAppointments();
  updateBookingSummary();
});