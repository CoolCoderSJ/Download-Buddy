let creating; 
async function setupOffscreenDocument(path) {

  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: path,
      reasons: ['BLOBS'],
      justification: 'need to convert a webp image to png',
    });
    await creating;
    creating = null;
  }
}

chrome.downloads.onCreated.addListener(
    async function (downloadItem) {
        console.log("Downloaded: " + downloadItem.finalUrl);
        console.log("Downloaded: " + downloadItem.mime);

        if (downloadItem.mime == "image/webp") {
            let url = downloadItem.finalUrl;            
            let filename = downloadItem.filename || "image.png";
            chrome.downloads.cancel(downloadItem.id);   

            await setupOffscreenDocument('offscreen.html');
            chrome.runtime.sendMessage({
                type: 'convertUrl',
                target: 'offscreen',
                data: { url, filename }
            });
        }
    }    
)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target != "background") {
        return;
    }

    if (message.type == "download") {
        chrome.downloads.download({
            url: message.data.url,
            filename: message.data.filename
        });
    }
});