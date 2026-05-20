chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    try {
      const data = extractShopeeData();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

function extractShopeeData() {
  // Title Selectors (Shopee changes these often)
  const titleSelectors = [
    "div.Vp_LSn > span",
    "div._44qnta > span",
    "div.flex.flex-auto.flex-column > div:first-child > span",
    "h1"
  ];
  
  // Image Selectors
  const imgSelectors = [
    "div._4v7Wp2 img",
    "div.Z_9m3Y img",
    "div.flex.flex-column > div:first-child img",
    ".product-detail img"
  ];

  // Description Selectors
  const descSelectors = [
    "div.f75968 > span",
    "div.pYm9_o",
    "div.ir6S_W",
    ".product-detail__description"
  ];

  const getElementText = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return "";
  };

  const getElementImage = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.src) return el.src;
    }
    return "";
  };

  // Special handling for Description to find by text if selectors fail
  let desc = getElementText(descSelectors);
  if (!desc) {
    const allSpans = Array.from(document.querySelectorAll("span"));
    const descLabel = allSpans.find(s => s.innerText.includes("Deskripsi Produk"));
    if (descLabel && descLabel.parentElement) {
       // Usually the next sibling or a sibling of the parent contains the text
       const container = descLabel.closest("div");
       if (container) {
          desc = container.innerText.replace("Deskripsi Produk", "").trim();
       }
    }
  }

  return {
    title: getElementText(titleSelectors),
    desc: desc,
    img: getElementImage(imgSelectors),
    link: window.location.href
  };
}
