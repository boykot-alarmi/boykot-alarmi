const boycott_db = "https://boykot-alarmi.github.io/lists/boykot_listesi.json";
const whitelist_urls = "https://boykot-alarmi.github.io/lists/whitelist_urls.json";

function get_boycott_db () {
 fetch(boycott_db)
  .then(response => response.json())
  .then(data => {
    chrome.storage.local.set({ boycott_db_data: data });
  });
}

function get_whitelist_urls () {
    fetch(whitelist_urls)
     .then(response => response.json())
     .then(data => {
       chrome.storage.local.set({ whitelist_urls_data: data });
     });
   }
   
get_boycott_db ();
get_whitelist_urls ();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'boycott_url_detected' || message.type === 'triggered_url_detected') {
    sendResponse({ status: "Popup açıldı!" });
    chrome.action.openPopup();
  }
  else if (message.type === 'request_tab_id') {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length > 0) {
        const activeTabId = tabs[0].id;
        sendResponse({ tabId: activeTabId });
      } else {
        sendResponse({ tabId: null });
      }
    });
    return true;
  }
  else {
    return;
  }
});
