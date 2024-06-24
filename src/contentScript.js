'use strict';

let isTranscripting = false;
let transcript = '';
let currentVideoTime = 0;
let advertTimes = [];  // Array to hold advert times
let advSkipped = false;


////////////////   Document Functions //////////////////

if (document.readyState === 'complete') {
  onDocumentLoaded();
} else {
  window.addEventListener('load', onDocumentLoaded);
}

// Function to execute when the document is fully loaded
function onDocumentLoaded() {
  console.log(" 1- Page loaded");
  chrome.runtime.sendMessage({ action: 'pageLoaded', message: '1- I am ready to serve.' });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'getTranscript') {
    console.log(' 2- Getting transcript');
    getYouTubeTranscript().then(transcript => {
      console.log(' 5- Sending transcript');
      if (transcript) {
        sendResponse({ status: true, message: transcript });
      } else {
        sendResponse({ status: false, message: 'Transcript not available.' });
      }
    }).catch(error => {
      sendResponse({ status: false, message: error.message });
    });
    return true;
  } else if (message.action === 'jumpToTime') {
    parseAdvertTimes(message.message);
    setInterval(skipAdvertCheck, 1000);
    sendResponse({ status: true, message: 'timing received' })
    return true;
  }
  return true;
});



async function jumpToTime(time) {
  const videos = document.getElementsByTagName('video');
  if (videos.length > 0) {
    for (let video of videos) {
      video.currentTime = time;
    }
    return `Jumped to time ${time}`;
  } else {
    return 'No video elements found on this page.';
  }
}

async function skipAdvertCheck() {
  if (!advSkipped) {
    const videos = document.getElementsByTagName('video');
    if (videos.length > 0) {
      currentVideoTime = videos[0].currentTime;

      const advertDetails = advertTimes.map(advert => ({
        ...advert,
        remainingTime: advert.start - currentVideoTime
      }));

      const nextAdvert = advertDetails.filter(advert => !advert.skipped && advert.remainingTime > 0)
        .sort((a, b) => a.remainingTime - b.remainingTime)[0];

      if (nextAdvert && nextAdvert.remainingTime) {
        console.log(`Remain to next advert ${nextAdvert.remainingTime}`);
      }

      for (let advert of advertTimes) {
        if (advert.start <= currentVideoTime && !advert.skipped) {
          const result = await jumpToTime(advert.end);
          console.log(result);
          advert.skipped = true;
          break;  // Skip one advert at a time
        }
      }

      advSkipped = advertTimes.every(advert => advert.skipped);
    }
  }
}

function parseAdvertTimes(message) {
  try {
    const parsedMessage = JSON.parse(message);
    advertTimes = parsedMessage.map(advert => ({
      start: convertTimeToSeconds(advert.start),
      end: convertTimeToSeconds(advert.end),
      skipped: false
    }));
    console.log('Adverts and timings:', advertTimes);
  } catch (error) {
    console.error('Failed to parse advert times:', error);
  }
}

function convertTimeToSeconds(timeStr) {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
}







///////    Main Functions  ///////////////////

async function getYouTubeTranscript() {
  console.log(" 3- Fetching Transcript");
  try {
    const existingTranscriptItems = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (existingTranscriptItems.length > 0) {
      return processTranscriptItems(existingTranscriptItems);
    }

    await waitForElement('#button-container');
    const buttonContainer = document.getElementById('button-container');
    if (!buttonContainer) {
      throw new Error("Button container not found");
    }

    const transcriptButton = buttonContainer.querySelector('button[aria-label="Show transcript"]');
    if (!transcriptButton) {
      throw new Error("Transcript button not found");
    }

    transcriptButton.click();

    await new Promise(resolve => {
      const observer = new MutationObserver((mutationsList, observer) => {
        for (let mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.target.id === 'content' && mutation.addedNodes.length > 0) {
            observer.disconnect();
            resolve();
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });

    const transcriptItems = document.querySelectorAll('ytd-transcript-segment-renderer');
    if (transcriptItems.length === 0) {
      throw new Error("Transcript items not found");
    }

    let processedText = processTranscriptItems(transcriptItems);

    const closeButton = document.querySelector('button[aria-label="Close transcript"][title=""]');
    if (closeButton) {
      closeButton.click();
    }
    return processedText;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

function processTranscriptItems(items) {
  console.log("4- Processing Transcript Items");
  const transcript = Array.from(items).map(item => ({
    time: item.querySelector('.segment-start-offset').innerText,
    text: item.querySelector('.segment-text').innerText
  }));
  // return arrayToString(transcript);
  return transcript;
}

function waitForElement(selector) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
    } else {
      const observer = new MutationObserver((mutations, observer) => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  });
}

function arrayToString(transcriptArray) {
  return transcriptArray.map(item => `${item.time} ${item.text}`).join('\n');
}
