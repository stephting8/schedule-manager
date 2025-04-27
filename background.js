chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'add_event') {
      addEventToGoogleCalendar(message.eventInfo);
    }
  });
  
  function addEventToGoogleCalendar(eventInfo) {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: eventInfo.title,
          start: {
            dateTime: generateDateTime(eventInfo.date, eventInfo.time),
            timeZone: 'America/New_York' // You can make this dynamic later
          },
          end: {
            dateTime: generateDateTime(eventInfo.date, addHour(eventInfo.time)),
            timeZone: 'America/New_York'
          }
        })
      })
      .then(response => response.json())
      .then(data => console.log('Event created: ', data))
      .catch(error => console.error('Error creating event:', error));
    });
  }
  
  function generateDateTime(dateString, timeString) {
    // Very simplified parser — can use libraries like chrono-node for natural language
    return new Date(`${dateString} ${timeString}`).toISOString();
  }
  
  function addHour(timeString) {
    // Add 1 hour to basic time for end of event
    let [hour, minutes] = timeString.split(':');
    hour = parseInt(hour) + 1;
    return `${hour}:${minutes || '00'}`;
  }