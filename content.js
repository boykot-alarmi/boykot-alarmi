function check_whitelist_url(tabId) {
  const current_url = window.location.href.toLowerCase();
  chrome.storage.local.get('whitelist_urls_data', function(result) {
    const whitelist_urls_data = result.whitelist_urls_data || [];
    const isWhitelisted = whitelist_urls_data.some(url => current_url.includes(url));
    
    if (isWhitelisted) {
      console.log("url whitelistte, check edilmedi", tabId);
      chrome.storage.local.set({ [`whitelist_url_${tabId}`]: true });
      chrome.runtime.sendMessage({ type: 'whitelist_url_detected', tabId: tabId });
    } else {
      console.log("whitelistte değil", tabId);
      chrome.storage.local.set({ [`whitelist_url_${tabId}`]: false });
    }
  });
}

function check_url(tabId) {
  const current_url = window.location.href.toLowerCase();
  chrome.storage.local.get('boycott_db_data', function(result) {
    const boycott_db_data = result.boycott_db_data || {};
    const boycott_url = Object.values(boycott_db_data).find(item => 
      item.url_list.some(url => current_url.includes(url))
    );
    if (boycott_url) {
      console.log("aha boykot url", tabId);
      chrome.storage.local.set({ [`boycott_url_${tabId}`]: true });
      chrome.runtime.sendMessage({ type: 'boycott_url_detected', tabId: tabId });
    } else {
      console.log("temiz siteymiş", tabId);
      chrome.storage.local.set({ [`boycott_url_${tabId}`]: false });
    }
  });
}

function check_url_trigger(tabId) {
  const current_url = window.location.href.toLowerCase();
  chrome.storage.local.get('boycott_db_data', function(result) {
    const boycott_db_data = result.boycott_db_data || {};
    const triggered_url = Object.values(boycott_db_data).find(item =>
      item.trigger_list.some(trigger =>
        current_url.includes(trigger.toLowerCase())
      )
    );
    if (triggered_url) {
      console.log("URL Trigger tetiklendi", tabId);
      chrome.storage.local.set({ [`triggered_url_${tabId}`]: true });
      chrome.runtime.sendMessage({ type: 'triggered_url_detected', tabId: tabId });
      chrome.action.openPopup();
    } else {
      console.log("URL Trigger tetiklenmedi.", tabId);
      chrome.storage.local.set({ [`triggered_url_${tabId}`]: false });
    }
  });
}

function check_text_trigger() {
  chrome.storage.local.get('boycott_db_data', function(result) {
    const boycott_db_data = result.boycott_db_data || {};
    const triggerWords = [];
    const boycottDataMap = {};

    Object.entries(boycott_db_data).forEach(([firmaKey, item]) => {
      const firma = item.firma || firmaKey;
      const reason = item.boykot_sebebi || 'Sebep belirtilmemiş';

      item.trigger_list.forEach(trigger => {
        const lowerTrigger = trigger.toLowerCase();
        triggerWords.push(lowerTrigger);
        boycottDataMap[lowerTrigger] = { firma, reason };
      });
    });

    check_text_nodes(document.body, triggerWords, boycottDataMap);
  });
}

function check_text_nodes(element, triggerWords, boycottDataMap) {
  let nodes = [element];

  while (nodes.length > 0) {
    const currentNode = nodes.shift();

    if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.nodeValue;
      const lowerText = text.toLowerCase();

      triggerWords.forEach(trigger => {
        const index = lowerText.indexOf(trigger);
        if (index !== -1) {
          const regex = new RegExp(trigger, 'i');
          const parts = text.split(regex);
          const matched = text.match(regex)[0];

          const info = boycottDataMap[trigger.toLowerCase()] || {};
          const firm = info.firma || 'Bilinmeyen Firma';
          const reason = info.reason || 'Sebep belirtilmemiş';
          const tooltip = `${firm} — ${reason}`;

          const span = document.createElement('span');
          span.innerHTML = `<span title="${tooltip}" style="text-decoration: none; color: #606060; background-color: #ebebeb;">${matched}</span>`;

          let fragment = document.createDocumentFragment();
          parts.forEach((part, j) => {
            fragment.appendChild(document.createTextNode(part));
            if (j < parts.length - 1) {
              fragment.appendChild(span.cloneNode(true));
            }
          });

          if (currentNode.parentNode) {
            currentNode.replaceWith(fragment);
          }
        }
      });
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      if (currentNode.tagName !== 'SCRIPT' && currentNode.tagName !== 'STYLE' && currentNode.tagName !== 'TEXTAREA' && currentNode.tagName !== 'INPUT') {
        nodes.push(...currentNode.childNodes);
      }
    }
  }
}

check_text_trigger();
setInterval(check_text_trigger, 3000);

function full_check(tabId) {
  check_whitelist_url(tabId);

  setTimeout(() => {
    chrome.storage.local.get([`whitelist_url_${tabId}`], function(result) {
      if (result[`whitelist_url_${tabId}`] === true) {
        return;
      } else {
        check_url(tabId);
        check_url_trigger(tabId);
      }
    });
  }, 100);
}

chrome.runtime.sendMessage({ type: 'request_tab_id' }, function(response) {
  if (response && response.tabId) {
    full_check(response.tabId);
  } else {
    console.error("Tab ID alınamadı! Check Fail...");
  }
});
