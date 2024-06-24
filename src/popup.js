'use strict';

import './popup.css';

const statusSwitch = document.getElementById('statusSwitch');
const statusLabel = document.querySelector('label[for="enableButton"]');

statusSwitch.addEventListener('change', () => {
  const status = statusSwitch.checked;
  chrome.cookies.set(
    {
      url: 'https://www.youtube.com',
      name: 'extension_status',
      value: status ? 'true' : 'false'
    },
    function (cookie) {
      if (chrome.runtime.lastError) {
        console.error('Error setting cookie:', chrome.runtime.lastError);
      } else {
        console.log('Cookie set successfully...');
        // Communicate with background file by sending a message
        // chrome.runtime.sendMessage({ action: 'statusChange', status: status }, (response) => { console.log(response) });
      }
    }
  );
  //update label accordingly to status change
  statusLabel.textContent = status ? 'Disable Auto Skip' : 'Enable Auto Skip';

  // Communicate with background file by sending a message
  chrome.runtime.sendMessage({ action: 'statusChange', message: status }, (response) => { console.log(response) });
});

function restoreStatus() {
  chrome.cookies.get(
    { url: 'https://www.youtube.com', name: 'extension_status' },
    function (cookie) {
      if (chrome.runtime.lastError) {
        console.error('Error getting cookie:', chrome.runtime.lastError);
      } else {
        if (!cookie) {
          console.log('extension status: not set');
          chrome.cookies.set(
            {
              url: 'https://www.youtube.com',
              name: 'extension_status',
              value: 'false'
            },
            function (cookie) {
              if (chrome.runtime.lastError) {
                console.error('Error setting default cookie:', chrome.runtime.lastError);
              } else {
                console.log('Default cookie set successfully');
              }
            }
          );
          statusSwitch.checked = false;
          statusLabel.textContent = 'Enable Auto Skip';
        } else {
          statusSwitch.checked = cookie.value === 'true';
          statusLabel.textContent = statusSwitch.checked ? 'Disable Auto Skip' : 'Enable Auto Skip';
        }
      }
    }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  restoreStatus();
});

// Listen for message
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log(`message arrived ${JSON.stringify(request)}`);
//   sendResponse('ok');
//   return true;
// });