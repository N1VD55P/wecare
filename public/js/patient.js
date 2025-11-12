
class DashboardItem {
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }

  createElement(tag, className, content = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    return el;
  }

  render() {
    throw new Error('render() must be implemented by child class');
  }
}
//child class

class Appointment extends DashboardItem {
  constructor(id, nurseName, nurseImage, type, dateTime, status = 'upcoming') {
    super(id, { nurseName, nurseImage, type, dateTime, status });
  }

  render() {
    const { nurseName, nurseImage, type, dateTime, status } = this.data;
    const card = this.createElement('div', 'appointment-card');
    card.dataset.id = this.id;
    
    card.innerHTML = `
      <div class="appointment-icon"><img src="${nurseImage}" alt="${nurseName}" /></div>
      <div class="appointment-details">
        <div class="appointment-name">${nurseName}</div>
        <div class="appointment-type">${type}</div>
        <div class="appointment-time">${dateTime}</div>
      </div>
      <button class="${status === 'upcoming' ? 'join-call-btn' : 'reschedule-btn'}">
        ${status === 'upcoming' ? 'Join Call' : 'Reschedule'}
      </button>
    `;
    
    this.attachEventListeners(card, status);
    return card;
  }

  attachEventListeners(card, status) {
    const btn = card.querySelector('button');
    btn.onclick = () => status === 'upcoming' ? this.joinCall(btn) : this.reschedule(card);
  }

  joinCall(btn) {
    btn.disabled = true;
    const overlay = this.createOverlay("📞 Joining Call...", `Connecting to ${this.data.nurseName}`);
    
    setTimeout(() => {
      overlay.querySelector('h2').textContent = "✅ Connected!";
      overlay.querySelector('p').textContent = "Your video call has started.";
      overlay.querySelector('.loader').style.display = 'none';
      setTimeout(() => { overlay.remove(); btn.disabled = false; }, 1200);
    }, 1800);
  }

  reschedule(card) {
    const newTime = prompt(`Reschedule ${this.data.nurseName}:\nEnter new date & time:`);
    if (newTime) {
      this.data.dateTime = newTime;
      card.querySelector('.appointment-time').textContent = newTime;
      alert(`✅ Rescheduled to: ${newTime}`);
    }
  }

  createOverlay(title, message) {
    const overlay = this.createElement('div', 'call-overlay');
    overlay.innerHTML = `
      <div class="call-box">
        <h2>${title}</h2><p>${message}</p>
        <div class="loader"></div>
        <button class="close-overlay-btn" style="margin-top:12px;padding:8px 12px;border-radius:8px;border:none;background:#e6eef9;cursor:pointer;">Cancel</button>
      </div>
    `;
    overlay.onclick = (e) => e.target === overlay && overlay.remove();
    overlay.querySelector('.close-overlay-btn').onclick = () => overlay.remove();
    document.body.appendChild(overlay);
    return overlay;
  }
}

class Reminder extends DashboardItem {
  constructor(id, title, time, icon, color, completed = false) {
    super(id, { title, time, icon, color, completed });
  }

  render() {
    const { title, time, icon, color, completed } = this.data;
    const item = this.createElement('div', 'reminder-item');
    item.dataset.id = this.id;
    item.style.cursor = 'pointer';
    item.style.opacity = completed ? '0.6' : '1';
    
    item.innerHTML = `
      <div class="reminder-icon ${color}"><i class="fas ${icon}"></i></div>
      <div class="reminder-details">
        <div class="reminder-title">${title}</div>
        <div class="reminder-time">${completed ? 'Completed ✓' : `Due at ${time}`}</div>
      </div>
    `;
    
    item.onclick = () => this.toggleComplete(item);
    return item;
  }

  toggleComplete(item) {
    this.data.completed = !this.data.completed;
    const timeDiv = item.querySelector('.reminder-time');
    timeDiv.textContent = this.data.completed ? 'Completed ✓' : `Due at ${this.data.time}`;
    item.style.opacity = this.data.completed ? '0.6' : '1';
  }
}

class Nurse extends DashboardItem {
  constructor(id, name, avatar, rating, reviewCount) {
    super(id, { name, avatar, rating, reviewCount });
  }

  render() {
    const { name, avatar, rating, reviewCount } = this.data;
    const card = this.createElement('div', 'nurse-card');
    card.dataset.id = this.id;
    
    card.innerHTML = `
      <img src="${avatar}" alt="${name}" class="nurse-avatar" />
      <div class="nurse-info">
        <div class="nurse-name">${name}</div>
        <div class="nurse-rating">
          <span class="rating-score">${rating}⭐</span>
          <span class="review-count">(${reviewCount} reviews)</span>
        </div>
      </div>
      <button class="book-again-btn">Book Again</button>
    `;
    
    card.querySelector('.book-again-btn').onclick = () => this.bookAgain(card);
    return card;
  }

  bookAgain(card) {
    const btn = card.querySelector('.book-again-btn');
    btn.disabled = true;
    btn.textContent = "Booking...";
    setTimeout(() => {
      btn.textContent = "Book Again";
      btn.disabled = false;
      alert(`✅ ${this.data.name} booked successfully!`);
    }, 800);
  }
}

/* 
   UNIFIED MANAGER
    */

class DashboardManager {
  constructor() {
    this.items = new Map();
  }

  add(item) {
    this.items.set(item.id, item);
    return this;
  }

  addMultiple(items) {
    items.forEach(item => this.add(item));
    return this;
  }

  remove(id) {
    this.items.delete(id);
    return this;
  }

  get(id) {
    return this.items.get(id);
  }

  renderAll(selector) {
    const container = document.querySelector(selector);
    if (!container) return this;
    
    container.innerHTML = '';
    this.items.forEach(item => container.appendChild(item.render()));
    return this;
  }

  filter(predicate) {
    return Array.from(this.items.values()).filter(predicate);
  }
}

/* 
   UTILITY FUNCTIONS
    */

const Utils = {
  query: (sel) => document.querySelector(sel),
  
  createOverlay(title, content, actions = []) {
    const overlay = document.createElement('div');
    overlay.className = 'call-overlay';
    overlay.innerHTML = `
      <div class="call-box" style="max-width:560px;text-align:left;">
        <h2>${title}</h2>
        ${content}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          ${actions.map(a => `<button data-action="${a.action}" style="padding:8px 12px;border-radius:8px;border:none;background:${a.bg};color:${a.color || '#000'};cursor:pointer;">${a.label}</button>`).join('')}
        </div>
      </div>
    `;
    
    overlay.onclick = (e) => e.target === overlay && overlay.remove();
    actions.forEach(a => {
      overlay.querySelector(`[data-action="${a.action}"]`).onclick = a.handler;
    });
    
    document.body.appendChild(overlay);
    return overlay;
  },

  showHistory() {
    const history = JSON.parse(localStorage.getItem("patient_medical_history") || "null") || {
      notes: [
        { date: "2025-09-12", title: "General Checkup", details: "BP: 120/80" },
        { date: "2025-07-01", title: "Medication Review", details: "Adjusted dosage" }
      ]
    };

    const content = `
      <div style="margin-top:8px;max-height:320px;overflow:auto;">
        ${history.notes.map(n => `
          <div style="padding:10px;border-radius:8px;border:1px solid #eef2ff;margin-bottom:8px;">
            <div style="font-weight:600">${n.title} <span style="font-weight:400;color:#64748b;font-size:13px">– ${n.date}</span></div>
            <div style="margin-top:6px;color:#334155">${n.details}</div>
          </div>
        `).join('')}
      </div>
    `;

    Utils.createOverlay('🧾 Medical History', content, [
      { action: 'close', label: 'Close', bg: '#e6eef9', handler: (e) => e.target.closest('.call-overlay').remove() },
      { 
        action: 'export', 
        label: 'Export (JSON)', 
        bg: '#1a3d7c', 
        color: '#fff',
        handler: () => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
          const a = document.createElement("a");
          a.href = dataStr;
          a.download = "medical_history.json";
          a.click();
        }
      }
    ]);
  },

  showHelp() {
    Utils.createOverlay('❓ How can we help?', '<p style="color:#475569">Choose a quick action or contact support.</p>', [
      { action: 'chat', label: 'Start Chat', bg: '#1a3d7c', color: '#fff', handler: () => { Utils.openChat(); } },
      { action: 'callback', label: 'Request Callback', bg: '#e6eef9', handler: (e) => {
        const overlay = e.target.closest('.call-overlay');
        overlay.querySelector('h2').textContent = '✅ Callback Requested';
        overlay.querySelector('p').textContent = 'Support will call you within 24 hours.';
      }},
      { action: 'close', label: 'Close', bg: '#f1f5f9', handler: (e) => e.target.closest('.call-overlay').remove() }
    ]);
  },

  openChat() {
    const win = window.open("", "ChatWindow", "width=420,height=580");
    if (!win) return alert("Please allow popups for chat.");
    
    win.document.write(`
      <!doctype html>
      <html><head><meta charset="utf-8"/><title>Nurse Chat</title>
      <style>
        body{font-family:Inter,Poppins,Arial,sans-serif;margin:0;background:#f7fbff;color:#0f172a}
        .container{padding:12px}h3{margin:6px 0 10px;font-size:18px}
        .chat-box{background:#fff;border-radius:10px;padding:12px;height:380px;overflow-y:auto;box-shadow:0 6px 18px rgba(2,6,23,.08)}
        .message{margin-bottom:8px;line-height:1.3}.message.user{text-align:right}
        .message .bubble{display:inline-block;padding:10px 12px;border-radius:10px;max-width:78%}
        .message.user .bubble{background:#1a3d7c;color:#fff;border-bottom-right-radius:4px}
        .message.nurse .bubble{background:#f1f5f9;color:#0f172a;border-bottom-left-radius:4px}
        .input-area{display:flex;gap:8px;margin-top:10px}
        .input-area input{flex:1;padding:10px;border-radius:10px;border:1px solid #e6eef9}
        .input-area button{padding:10px 14px;border-radius:10px;border:none;background:#1a3d7c;color:white;cursor:pointer}
        .muted{color:#64748b;font-size:13px;margin-top:6px}
      </style></head><body>
      <div class="container">
        <h3>💬 Chat with Nurse</h3>
        <div class="chat-box" id="chatBox">
          <div class="message nurse"><div class="bubble"><strong>Nurse:</strong> Hello! How can I help you today?</div></div>
        </div>
        <div class="input-area">
          <input type="text" id="chatInput" placeholder="Type your message..."/>
          <button id="sendBtn">Send</button>
        </div>
        <div class="muted">This is a demo chat. For emergencies, call your local emergency number.</div>
      </div>
      <script>
        const chatBox=document.getElementById('chatBox'),chatInput=document.getElementById('chatInput'),sendBtn=document.getElementById('sendBtn');
        function appendMessage(kind,text){const w=document.createElement('div');w.className='message '+kind;const b=document.createElement('div');b.className='bubble';b.innerHTML=text;w.appendChild(b);chatBox.appendChild(w);chatBox.scrollTop=chatBox.scrollHeight}
        sendBtn.onclick=()=>{const txt=chatInput.value.trim();if(!txt)return;appendMessage('user','<strong>You:</strong> '+txt.replace(/</g,'&lt;').replace(/>/g,'&gt;'));chatInput.value='';sendBtn.disabled=true;setTimeout(()=>{appendMessage('nurse','<strong>Nurse:</strong> Thanks – I have noted that. Will get back shortly.');sendBtn.disabled=false},900)};
        chatInput.onkeydown=(e)=>e.key==='Enter'&&(e.preventDefault(),sendBtn.click());
      </script></body></html>
    `);
    win.focus();
  }
};

/* ---------------------------
   INITIALIZE APP
   --------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  
  // Create managers
  const appointments = new DashboardManager();
  const reminders = new DashboardManager();
  const nurses = new DashboardManager();

  // Populate data using method chaining
  appointments
    .add(new Appointment(1, "Nurse Vibha", "https://img.freepik.com/premium-psd/png-smiling-indian-woman-nurse-pose-against-transparent-background-ideal-healthcare-medical-related-content_1031432-57667.jpg?w=360", "Home Visit - General Checkup", "Today, 2:00 PM", "upcoming"))
    .add(new Appointment(2, "Nurse Akansha Sharma", "https://img.freepik.com/premium-psd/png-smiling-indian-woman-nurse-pose-against-transparent-background-ideal-healthcare-medical-related-content_1031432-58079.jpg?w=360", "Medication Review", "Tomorrow, 10:00 AM", "scheduled"))
    .renderAll('.appointments-list');

  reminders
    .addMultiple([
      new Reminder(1, "Blood Pressure Medication", "8:00 PM", "fa-pills", "orange"),
      new Reminder(2, "Physical Therapy", "3:00 PM", "fa-dumbbell", "green", true),
      new Reminder(3, "Temperature Check", "10:00 PM", "fa-thermometer-half", "blue")
    ])
    .renderAll('.reminders-list');

  nurses
    .addMultiple([
      new Nurse(1, "Mitali", "https://www.vhv.rs/dpng/d/427-4278765_placement-for-all-students-indian-nurse-photo-png.png", 4.9, 127),
      new Nurse(2, "Manasvi", "https://toppng.com/uploads/preview/why-choose-ihna-indian-nursing-student-11562931490arkyr8bc0k.png", 4.8, 89)
    ])
    .renderAll('.nurses-grid');

  // Action buttons
  Utils.query("#find-nurse-btn")?.addEventListener("click", () => window.open("nurses.html", "_blank"));
  Utils.query("#prescription-btn")?.addEventListener("click", () => window.location.href = "prescriptions.html");
  Utils.query("#history-btn")?.addEventListener("click", Utils.showHistory);
  Utils.query("#chat-btn")?.addEventListener("click", Utils.openChat);
  Utils.query(".help-btn")?.addEventListener("click", Utils.showHelp);

  // Initialize sample data
  if (!localStorage.getItem("patient_medical_history")) {
    localStorage.setItem("patient_medical_history", JSON.stringify({
      notes: [
        { date: "2025-09-12", title: "General Checkup", details: "BP: 120/80 – Advised low-salt diet." },
        { date: "2025-07-01", title: "Medication Review", details: "Reviewed meds, adjusted dosage." },
        { date: "2025-03-22", title: "Blood Test", details: "Cholesterol slightly high; advised exercise." }
      ]
    }));
  }
});