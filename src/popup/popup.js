document.addEventListener("DOMContentLoaded", () => {
  const scrapeBtn = document.getElementById("scrapeBtn");
  const resultDiv = document.getElementById("result");
  const errorDiv = document.getElementById("error");

  scrapeBtn.addEventListener("click", async () => {
    errorDiv.classList.add("hidden");
    resultDiv.classList.add("hidden");

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Ask content script to scrape
    chrome.tabs.sendMessage(tab.id, { action: "scrapeJob" }, (response) => {
      if (chrome.runtime.lastError) {
        errorDiv.textContent = "Error: " + chrome.runtime.lastError.message;
        errorDiv.classList.remove("hidden");
        return;
      }

      if (response?.success) {
        const data = response.data;
        document.getElementById("company").textContent = data.companyName || "—";
        document.getElementById("position").textContent = data.position || "—";
        document.getElementById("location").textContent = data.location || "—";

        resultDiv.classList.remove("hidden");
        console.log("✅ Scraped job data:", data);
      } else {
        errorDiv.textContent = "Failed: " + (response?.error || "Unknown error");
        errorDiv.classList.remove("hidden");
      }
    });
  });
});
