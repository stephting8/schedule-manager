// 1. Scan the body text of the email (initial run)
const bodyText = document.body.innerText;
const matches = findEventInText(bodyText);

// 2. If event detected, show popup
if (matches) {
  showSuggestionPopup(matches);
}

// 3. Function to find event in email text
function findEventInText(text) {
  const dateRegex = /\b(on )?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi;
  const timeRegex = /\b\d{1,2}(:\d{2})?\s?(AM|PM)\b/gi;

  const date = text.match(dateRegex);
  const time = text.match(timeRegex);

  if (date && time) {
    return { 
      date: date[0], 
      time: time[0], 
      title: guessTitle(text) 
    };
  }
  return null;
}

// 4. Function to guess event title based on keywords
function guessTitle(text) {
  text = text.toLowerCase();
  if (text.includes('meeting')) return 'Meeting';
  if (text.includes('assignment')) return 'Assignment Due';
  if (text.includes('party')) return 'Party';
  if (text.includes('class')) return 'Class';
  return 'Event';
}

// 5. Function to create and show the suggestion popup
function showSuggestionPopup(eventInfo) {
  // Create popup container
  const popup = document.createElement('div');
  popup.id = 'calendar-popup';

  popup.innerHTML = `
    <div id="calendar-popup-header">📅 Add Event to Calendar?</div>
    <div id="calendar-popup-body">
      <div><strong>Title:</strong> <span id="event-title">${eventInfo.title}</span></div>
      <div><strong>Date:</strong> <span id="event-date">${eventInfo.date}</span></div>
      <div><strong>Time:</strong> <span id="event-time">${eventInfo.time}</span></div>
      <div><strong>Location:</strong> <span id="event-location">Unknown</span></div>
    </div>
    <div id="calendar-popup-actions">
        <button id="edit-event">Edit</button>
        <button id="add-event">Add Now</button>
        <button id="dismiss-event">Ignore</button>
    </div>
  `;

  // Create and attach style
  const style = document.createElement('style');
  style.textContent = `
    #calendar-popup {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 260px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      padding: 16px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 9999;
      opacity: 0;
      animation: fadeInPopup 0.4s ease-out forwards;
    }
    @keyframes fadeInPopup {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #calendar-popup-header {
      font-weight: bold;
      margin-bottom: 12px;
    }
    #calendar-popup-body div {
      margin-bottom: 8px;
    }
    #calendar-popup-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 12px;
    }
    #calendar-popup-actions button {
      flex: 1;
      margin: 0 4px;
      padding: 6px 10px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    #calendar-popup-actions button#edit-event {
      background-color: #f0ad4e;
    }
    #calendar-popup-actions button#dismiss-event {
      background-color: #e74c3c;
    }
    #calendar-popup-actions button:hover {
      background-color: #155a9c;
    }
  `;
  document.head.appendChild(style);

  // Add popup to page
  document.body.appendChild(popup);

  // Set up button functionality
  document.getElementById('add-event').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'add_event', eventInfo }, () => {
      showSuccessToast("Event Added Successfully! ✅");
      document.getElementById('calendar-popup').remove();
    });
  });

  document.getElementById('edit-event').addEventListener('click', () => {
    enableEditMode(eventInfo);
  });

  document.getElementById('dismiss-event').addEventListener('click', () => {
    document.getElementById('calendar-popup').remove();
  });
}

// 6. Function to enable Edit Mode
function enableEditMode(eventInfo) {
  document.getElementById('event-title').outerHTML = `<input id="edit-title" value="${eventInfo.title}" style="width: 100%; margin-top: 4px;">`;
  document.getElementById('event-date').outerHTML = `<input id="edit-date" value="${eventInfo.date}" style="width: 100%; margin-top: 4px;">`;
  document.getElementById('event-time').outerHTML = `<input id="edit-time" value="${eventInfo.time}" style="width: 100%; margin-top: 4px;">`;
  document.getElementById('event-location').outerHTML = `<input id="edit-location" value="Unknown" style="width: 100%; margin-top: 4px;">`;

  const editButton = document.getElementById('edit-event');
  editButton.textContent = 'Save';
  editButton.id = 'save-event';

  // Set up Save button
  document.getElementById('save-event').addEventListener('click', () => {
    eventInfo.title = document.getElementById('edit-title').value;
    eventInfo.date = document.getElementById('edit-date').value;
    eventInfo.time = document.getElementById('edit-time').value;
    eventInfo.location = document.getElementById('edit-location').value;

    document.getElementById('calendar-popup-body').innerHTML = `
      <div><strong>Title:</strong> <span id="event-title">${eventInfo.title}</span></div>
      <div><strong>Date:</strong> <span id="event-date">${eventInfo.date}</span></div>
      <div><strong>Time:</strong> <span id="event-time">${eventInfo.time}</span></div>
      <div><strong>Location:</strong> <span id="event-location">${eventInfo.location}</span></div>
    `;

    document.getElementById('calendar-popup-actions').innerHTML = `
      <button id="edit-event">Edit</button>
      <button id="add-event">Add Now</button>
      <button id="dismiss-event">Ignore</button>
    `;

    document.getElementById('edit-event').addEventListener('click', () => enableEditMode(eventInfo));
    document.getElementById('add-event').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'add_event', eventInfo }, () => {
        showSuccessToast("Event Added Successfully! ✅");
        document.getElementById('calendar-popup').remove();
      });
    });
    document.getElementById('dismiss-event').addEventListener('click', () => {
      document.getElementById('calendar-popup').remove();
    });
  });
}

// 7. Function to show Success Toast
function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '100px';
  toast.style.right = '20px';
  toast.style.background = '#4caf50';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
  toast.style.zIndex = '10000';
  toast.style.fontFamily = 'Arial, sans-serif';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.5s ease-out';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '1';
  }, 100);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

// 8. Mutation Observer to Watch Gmail Page Changes
const observer = new MutationObserver(() => {
  const bodyText = document.body.innerText;
  const matches = findEventInText(bodyText);
  
  if (matches && !document.getElementById('calendar-popup')) {
    showSuggestionPopup(matches);
  }
});

// Slight delay to let Gmail page load completely before starting observer
setTimeout(() => {
  observer.observe(document.body, { childList: true, subtree: true });
}, 300); 