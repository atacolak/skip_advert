'use strict';
let isEnabled = false;
let isActive = false;
let isRunning = false;
let transcript = "";
let timings = [];

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  console.info('Background: Message received from content script:', message);

  if (message.action === 'pageLoaded') {
    console.log(`Content: ${message.message}`);
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Background: 1-Get transcript');

      chrome.tabs.sendMessage(tabs[0].id, { action: 'getTranscript' }, async (response) => {
        if (response.status) {
          transcript = arrayToString(response.message) //convert array to string
          console.log('Background: 2- Transcript ready ask to AI');
          const answer = await askToGroq(transcript);
          console.log('Bacground: 3- AI answer is ', answer)
          if (answer.status) {
            timings = answer.message
            chrome.tabs.sendMessage(tabs[0].id, { action: 'jumpToTime', message: timings }, async (response) => {
              if (response.status) {
                console.log('Content: jump result ', response.message)
              }
            });
          }
        } else {
          console.log('Background: 2-Transcript not reveiced', response.message);
        }
      });

      // await new Promise((resolve, reject) => {
      //   chrome.tabs.sendMessage(tabs[0].id, { action: 'secondMessage', data: response }, (response) => {
      //     if (chrome.runtime.lastError) {
      //       reject(chrome.runtime.lastError);
      //     } else {
      //       resolve(response);
      //     }
      //   });
      // });

    } catch (error) {
      console.info('Background script: Error occurred:', error);
    }
    return true;
  } else if (message.action === 'statusChange') {
    sendResponse('Background script: Status received');
    return true;
  }
});
function arrayToString(arr) {
  if (Array.isArray(arr)) {
    return arr.map(item => `Time: ${item.time}, Text: ${item.text}`).join('\n');
  }
  return `Time: ${arr.time}, Text: ${arr.text}`;
}

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env['GROQ_API_KEY'],
  dangerouslyAllowBrowser: true,
});

async function askToGroq(transcript) {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Your task as an assistant is to read through this transcript and tell the user the time stamps of where the advertisement starts if all scripts are not related to one product, if any.
                    It is better if you are able to determine the segment prior to the assumed advertisement start in cases where the YouTuber might prepare ground for the advertisement.
                    This is usually in the form of: "Do you lack ... in your life, well, ... can help with that!, my sponsor ..., thanks to our sponsor ..."
                    Your output should only include the timestamps in a JSON array of objects, don't add any comment and explanation or the system will crash. 
                    The JSON schema should be:
                    [
                      { "start": "number (0-60):number (0-60)", "end": "number (0-60):number (0-60)" }
                    ]`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      model: 'llama3-70b-8192',
      temperature: 0,
      top_p: 1,
      stream: false,
    });

    return {
      status: true,
      message: response.choices[0].message?.content,
    };
  } catch (error) {
    console.warning("Failed to get response from Groq:", error);
    return {
      status: false,
      message: error,
    };
  }
}
function checkStatusAndUpdateIcon(tabId, url) {
  updateExtensionStatus()
  if (!tabId || !url) {
    console.warn('checkStatusAndUpdateIcon: Missing tabId or url');
    return;
  }
  isActive = url.includes('youtube.com/watch');
  const path = isEnabled ? (isActive ? 'icons/green.png' : 'icons/red.png') : 'icons/128.png';
  chrome.action.setIcon({ path: path, tabId: tabId });
  if (!isRunning) {
    isRunning = true;
    runTranscript();
  }
}
function updateExtensionStatus() {
  chrome.cookies.get({ url: 'https://www.youtube.com', name: 'extension_status' }, (cookie) => {
    isEnabled = cookie && cookie.value === 'true';
    console.log("init cookie check: ", isEnabled)
  });
}

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url) {
//     checkStatusAndUpdateIcon(tabId, tab.url);
//   }
// });

// chrome.tabs.onActivated.addListener((activeInfo) => {
//   chrome.tabs.get(activeInfo.tabId, (tab) => {
//     if (tab && tab.url) {
//       checkStatusAndUpdateIcon(activeInfo.tabId, tab.url);
//     }
//   });
// });

// chrome.runtime.onInstalled.addListener(() => {
//   updateExtensionStatus();
// });

// chrome.runtime.onStartup.addListener(() => {
//   updateExtensionStatus();
// });
