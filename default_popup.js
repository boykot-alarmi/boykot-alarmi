document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const tabId = tabs[0].id;
    const audioPlayedKey = `audio_played_${tabId}`;

    chrome.storage.local.get([audioPlayedKey], function(result) {
      if (!result[audioPlayedKey]) {
        const audio = new Audio(chrome.runtime.getURL("popup.mp3"));
        audio.volume = 0.1;
        audio.play();
        chrome.storage.local.set({ [audioPlayedKey]: true });
      }
    });

    chrome.storage.local.get([`whitelist_url_${tabId}`, `boycott_url_${tabId}`, `triggered_url_${tabId}`, 'boycott_db_data'], function(result) {
      const messageElement = document.getElementById('message');
      const boycott_db_data = result.boycott_db_data || {};

      if (result[`whitelist_url_${tabId}`] === true) {
        messageElement.innerHTML = "Sayfa beyaz listede,<br>Tarama yapılmayacak.";
        messageElement.classList.add('gray');
        messageElement.classList.remove('safe', 'warning', 'error');
      } 
      else if (result[`boycott_url_${tabId}`] === true) {
        messageElement.innerHTML = "Boykotlu Site!";
        messageElement.classList.add('warning');
        messageElement.classList.remove('safe', 'gray', 'error');

        let matchedFirm = null;
        let matchedReason = null;
        let matchedSource = "";
        const currentUrl = tabs[0].url.toLowerCase();

        Object.values(boycott_db_data).forEach(item => {
          const match = item.url_list.some(url => currentUrl.includes(url.toLowerCase()));
          if (match) {
            matchedFirm = item.firma || 'Bilinmeyen Firma';
            matchedReason = item.boykot_sebebi || 'Sebep belirtilmemiş';
            matchedSource = item.kaynak || "";
          }
        });

        if (matchedFirm) {
          const hasSource = matchedSource && matchedSource.trim() !== "";

          messageElement.innerHTML += `
            <br><br>
            <div style="color: #ebebeb; text-align: left;">
              <strong>Firma:</strong> ${matchedFirm}
            </div>
            <br>
            <div style="color: #ebebeb; text-align: left;">
              <strong>Boykot Sebebi:</strong> 
              ${
                hasSource
                  ? `<a href="${matchedSource}" target="_blank" style="color: #ebebeb; text-decoration: underline;">${matchedReason}</a>`
                  : matchedReason
              }
            </div>
          `;
        }
      } 
      else if (result[`triggered_url_${tabId}`] === true) {
        messageElement.innerHTML = "Şüpheli URL!";
        messageElement.classList.add('sus');
        messageElement.classList.remove('safe', 'gray', 'error');

        let matchedFirm = null;
        let matchedReason = null;
        let matchedSource = "";
        const currentUrl = tabs[0].url.toLowerCase();

        Object.values(boycott_db_data).forEach(item => {
          const match = item.trigger_list.some(trigger => currentUrl.includes(trigger.toLowerCase()));
          if (match) {
            matchedFirm = item.firma || 'Bilinmeyen Firma';
            matchedReason = item.boykot_sebebi || 'Sebep belirtilmemiş';
            matchedSource = item.kaynak || "";
          }
        });

        if (matchedFirm) {
          messageElement.innerHTML += `
            <br><br>
            <div style="color: #ebebeb; text-align: center;">
              Bu site ${matchedFirm} ile ilgili olabilir.
            </div>
            <br>
            <div style="color: #ebebeb; text-align: left;">
              <strong>Boykot Sebebi:</strong> 
              ${
                matchedSource.trim() !== "" 
                  ? `<a href="${matchedSource}" target="_blank" style="color: #ebebeb; text-decoration: underline;">${matchedReason}</a>`
                  : matchedReason
              }
            </div>
          `;
        }
      } 
      else if (result[`triggered_url_${tabId}`] === false) {
        messageElement.innerHTML = "Boykotlu herhangi bir şeye rastlanmadı.";
        messageElement.classList.add('safe');
        messageElement.classList.remove('warning', 'gray', 'error');
      } 
      else {
        messageElement.innerHTML = "Şimdilik bir sorun yok.";
        messageElement.classList.add('gray');
        messageElement.classList.remove('safe', 'warning', 'error');
      }

      messageElement.style.paddingBottom = "20px";
    });
  });

  document.getElementById('viewDetailsButton').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://www.boykotalarmi.com' });
  });

  document.getElementById('settingsButton').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('ayarlar.html') });
  });
});