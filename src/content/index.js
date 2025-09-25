// Greenhouse-specific job scraper
console.log('Content script file is loading...');

class GreenhouseScraper {
    constructor() {
        this.jobData = {
            companyName: '',
            applicationDate: new Date().toISOString().split('T')[0], // Today's date
            position: '',
            location: '',
            currentJobStatus: 'Applied', // Default flag
            url: window.location.href
        };
    }

    // Checks if current page is a Greenhouse job posting
    isGreenhousePage() {
        const hostname = window.location.hostname;
        return hostname.includes('greenhouse.io') ||
            document.querySelector('[data-source="greenhouse"]') !== null;
    }

  // Extract job details from Greenhouse page
  scrapeJobDetails() {

      // Company name - multiple possible selectors
      this.jobData.companyName = this.extractText([
          '.company-name',
          '[data-th="Company"]',
          '.header-company-name',
          //   'h1 .company',
          '.application-header .company-name'
      ]);

      // Position/Job title
      this.jobData.position = this.extractText([
          '.job-title',
          '[data-th="Job Title"]',
          '.application-header h1',
          '.posting-headline h2',
          'h1',
      ]);

      // Location
      this.jobData.location = this.extractText([
          '[data-th="Office"]',
          '.posting-categories .location',
          '.posting-headline .location',
          '.application-header .location',
          '.job-location',
          // '.location', // too generic; can match unrelated UI
          '[data-mapped="location"]',
          '[data-mapped="office"]',
          '.job__location div',
          '.app-location'
      ]);

      // Clean up the extracted data
      this.cleanData();

      // Validate that we got the essential data
      if (!this.jobData.position) {
          throw new Error('Could not extract job position');
      }

      return this.jobData;
  }

    extractText(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        return '';
    }

  cleanData() {
    // Remove extra whitespace and clean company name
    this.jobData.companyName = this.jobData.companyName
      .replace(/\s+/g, ' ')
      .trim();

    // Clean position title
    this.jobData.position = this.jobData.position
      .replace(/\s+/g, ' ')
      .trim();

    // Clean location and remove common prefixes
    this.jobData.location = this.jobData.location
      .replace(/^(Location:\s*|Office:\s*)/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // If company name is empty, try to extract from URL or page title
    if (!this.jobData.companyName) {
      this.jobData.companyName = this.extractCompanyFromUrl() || 
                                this.extractCompanyFromTitle();
    }
  }

  // Extract company name from URL pattern
  extractCompanyFromUrl() {
    const host = location.hostname;
    const pathSegs = location.pathname.split('/').filter(Boolean);

    // case 1: company.greenhouse.io
    const sub = host.split('.')[0];
    if (host.endsWith('.greenhouse.io') && !['boards','job-boards','www'].includes(sub)) {
        return this.beautify(sub);
    }

    // case 2 & 3: boards.greenhouse.io/<company>/... or job-boards.greenhouse.io/<company>/...
    if ((host === 'boards.greenhouse.io' || host === 'job-boards.greenhouse.io') && pathSegs.length > 0) {
        return this.beautify(pathSegs[0]);
    }

    return '';
  }

  beautify(str) {
    return str.replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
                .trim();
  } 

  // Extract company name from page title
  extractCompanyFromTitle() {
    const title = document.title;
    const parts = title.split(' - ');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return '';
  }

  // Get additional job metadata if available
  getJobMetadata() {
    const metadata = {};
    
    // Job ID from URL
    const jobIdMatch = window.location.href.match(/jobs\/(\d+)/);
    if (jobIdMatch) {
      metadata.jobId = jobIdMatch[1];
    }

    // Department if available
    const department = this.extractText([
      '.department',
      '[data-th="Department"]',
      '.job-department'
    ]);
    if (department) {
      metadata.department = department;
    }

    return metadata;
  }
}

// Initialize scraper
const greenhouseScraper = new GreenhouseScraper();

// Listen for messages from popup/background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === 'scrapeJob') {
        try {
            if (!greenhouseScraper.isGreenhousePage()) {
                sendResponse({
                    success: false,
                    error: 'This is not a Greenhouse job page'
                });
                return;
            }

            const jobData = greenhouseScraper.scrapeJobDetails();
            const metadata = greenhouseScraper.getJobMetadata();
            console.log('🔧 Scraped job data:', jobData, metadata);
            sendResponse({
                success: true,
                data: { ...jobData, metadata }
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    if (request.action === 'checkJobPage') {
        const isGreenhouseJob = greenhouseScraper.isGreenhousePage();
        sendResponse({
            isJobPage: isGreenhouseJob,
            platform: 'Greenhouse'
        });
    }
    return;
});

// Auto-detect Greenhouse job pages
// if (greenhouseScraper.isGreenhousePage()) {
//   chrome.runtime.sendMessage({
//     action: 'jobPageDetected',
//     platform: 'Greenhouse',
//     url: window.location.href
//   });
// }