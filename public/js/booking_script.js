let selectedNurse = null;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

function loadSelectedNurse() {
  // 🎯 First, check if window.nurseData was set by EJS template
  if (typeof window.nurseData !== 'undefined' && window.nurseData) {
    selectedNurse = window.nurseData;
    console.log('✅ Nurse data loaded from EJS template:', selectedNurse);
    return;
  }
  
  // Fallback: try URL params
  const urlParams = new URLSearchParams(window.location.search);
  const nurseId = urlParams.get('nurse');
  
  if (nurseId) {
    console.log('Attempting to fetch nurse data for ID:', nurseId);
    // Could fetch from API here if needed
  } else {
    // Fallback: try sessionStorage
    const storedNurse = sessionStorage.getItem('selectedNurse');
    if (storedNurse) {
      selectedNurse = JSON.parse(storedNurse);
      console.log('✅ Nurse data loaded from sessionStorage:', selectedNurse);
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
  
  proceedBtn.addEventListener('click', async function() {
    // 🎯 Debug: Check what selectedNurse contains
    console.log('Proceed clicked!');
    console.log('selectedNurse:', selectedNurse);
    console.log('window.nurseData:', window.nurseData);
    
    // If selectedNurse is empty but window.nurseData is set, use it
    if (!selectedNurse && typeof window.nurseData !== 'undefined') {
      selectedNurse = window.nurseData;
      console.log('✅ Using window.nurseData as selectedNurse');
    }
    
    if (!selectedNurse) {
      console.error('❌ selectedNurse is null:', selectedNurse);
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

    // 🎯 Send booking request to server
    try {
      const response = await fetch('/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nurseId: selectedNurse._id || selectedNurse.id || 'default',
          nurseName: selectedNurse.name,
          nurseImage: selectedNurse.profileImage || selectedNurse.image,
          specialization: selectedNurse.specialization,
          serviceType: selectedService.name,
          servicePrice: selectedService.price,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          paymentMethod: selectedPayment,
          insuranceCoverage: document.getElementById('insurance').checked
        })
      });

      const result = await response.json();

      if (result.ok) {
        alert('✅ Appointment booked successfully!');
        console.log('Appointment created:', result.appointment);
        
        // Reload appointments
        loadUserAppointments();
        
        // Reset form
        document.querySelector('.date-input').value = '';
        document.querySelector('.time-input').value = '';
        selectedDate = null;
        selectedTime = null;
        selectedService = null;
        
        // Clear service selection styling
        document.querySelectorAll('.service-card').forEach(c => c.style.border = '2px solid #e9ecef');
        
        updateBookingSummary();
      } else {
        alert('❌ Error: ' + (result.error || 'Failed to book appointment'));
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert('❌ Error booking appointment: ' + err.message);
    }
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
  if (!appointmentsContainer) return;

  // 🎯 Fetch from API instead of localStorage
  fetch('/api/appointments')
    .then(res => res.json())
    .then(data => {
      if (!data.ok || data.appointments.length === 0) {
        appointmentsContainer.innerHTML = '<h2>Your Appointments</h2><p style="color: #666;">No appointments yet</p>';
        return;
      }

      let appointmentsHTML = '<h2>Your Appointments</h2>';
      
      const recentAppointments = data.appointments.slice(0, 5);
      
      recentAppointments.forEach((apt, index) => {
        const appointmentDate = new Date(apt.appointmentDate);
        const isPast = appointmentDate < new Date();
        
        appointmentsHTML += `
          <div class="appointment-card">
            <div class="appointment-avatar">
              <img src="${apt.nurseImage || 'https://via.placeholder.com/50'}" alt="${apt.nurseName}" class="avatar-img">
            </div>
            <div class="appointment-info">
              <div class="appointment-name">${apt.nurseName}</div>
              <div class="appointment-specialty">${apt.specialization || ''}</div>
              <div class="appointment-time">${new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}, ${apt.appointmentTime}</div>
              <div class="appointment-service">${apt.serviceType} - Rs ${apt.servicePrice}</div>
              <div class="appointment-status" style="color: ${apt.status === 'cancelled' ? '#dc3545' : '#28a745'}; font-weight: bold;">${apt.status.toUpperCase()}</div>
            </div>
            <div class="appointment-actions">
              ${isPast ? 
                '<button class="completed-btn">Completed</button>' : 
                (apt.status === 'cancelled' ? 
                  '<span style="color: #dc3545;">Cancelled</span>' :
                  `<button class="cancel-btn" onclick="cancelAppointment('${apt._id}')">Cancel</button>` +
                  '<button class="reschedule-btn">Reschedule</button>'
                )
              }
            </div>
          </div>
        `;
      });
      
      appointmentsContainer.innerHTML = appointmentsHTML;
    })
    .catch(err => {
      console.error('Error loading appointments:', err);
      appointmentsContainer.innerHTML = '<h2>Your Appointments</h2><p style="color: #666;">Error loading appointments</p>';
    });
}

function cancelAppointment(appointmentId) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    // 🎯 Send cancel request to server
    fetch(`/cancel-appointment/${appointmentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        alert('✅ Appointment cancelled successfully');
        loadUserAppointments();
      } else {
        alert('❌ Error: ' + (data.error || 'Failed to cancel appointment'));
      }
    })
    .catch(err => {
      console.error('Error cancelling appointment:', err);
      alert('❌ Error cancelling appointment: ' + err.message);
    });
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