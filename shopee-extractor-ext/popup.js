let extractedData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const extractBtn = document.getElementById("extract-btn");
  const copyBtn = document.getElementById("copy-btn");
  const statusMsg = document.getElementById("status");
  const preview = document.getElementById("preview");
  
  extractBtn.addEventListener("click", async () => {
    statusMsg.innerText = "Extracting...";
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes("shopee.co.id")) {
      statusMsg.innerText = "Please navigate to a Shopee product page.";
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "extract" });
      
      if (response && response.success) {
        extractedData = response.data;
        updatePreview(extractedData);
        statusMsg.classList.add("hidden");
        preview.classList.remove("hidden");
        copyBtn.classList.remove("hidden");
        extractBtn.innerText = "Re-extract";
      } else {
        statusMsg.innerText = "Failed to extract data. Make sure page is loaded.";
      }
    } catch (err) {
      console.error(err);
      statusMsg.innerText = "Error: Extension not loaded on this page. Refresh and try again.";
    }
  });

  copyBtn.addEventListener("click", async () => {
    if (!extractedData) return;
    
    const jsonStr = JSON.stringify(extractedData, null, 2);
    
    try {
      await navigator.clipboard.writeText(jsonStr);
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "Copied!";
      copyBtn.style.background = "#10b981";
      setTimeout(() => {
        copyBtn.innerText = originalText;
        copyBtn.style.background = "";
      }, 2000);
    } catch (err) {
      statusMsg.innerText = "Failed to copy to clipboard.";
      statusMsg.classList.remove("hidden");
    }
  });
});

function updatePreview(data) {
  document.getElementById("product-title").innerText = data.title || "No Title Found";
  document.getElementById("product-desc").innerText = data.desc || "No Description Found";
  const imgEl = document.getElementById("product-img");
  if (data.img) {
    imgEl.src = data.img;
  } else {
    imgEl.src = "https://via.placeholder.com/150?text=No+Image";
  }
}
