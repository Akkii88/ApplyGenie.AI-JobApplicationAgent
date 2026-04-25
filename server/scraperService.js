const { chromium } = require('playwright');

async function scrapeJobDescription(jobLink) {
  // Validate URL
  if (!jobLink || (!jobLink.startsWith('http://') && !jobLink.startsWith('https://'))) {
    throw new Error('Invalid URL: Must start with http:// or https://');
  }

  let browser;
  try {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Navigating to:', jobLink);
    await page.goto(jobLink, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Extracting text...');
    const text = await page.evaluate(() => {
      // Extract visible text from body
      const elements = document.querySelectorAll('body *');
      let visibleText = '';
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && el.textContent.trim()) {
          visibleText += el.textContent.trim() + ' ';
        }
      }
      return visibleText;
    });

    // Clean text
    let cleanedText = text.replace(/\s+/g, ' ').trim();
    if (cleanedText.length > 6000) {
      cleanedText = cleanedText.substring(0, 6000) + '...';
    }

    console.log('Extracted text length:', cleanedText.length);
    return cleanedText;
  } catch (error) {
    console.error('Error scraping job link:', error.message);
    if (error.message.includes('net::ERR_NAME_NOT_RESOLVED') || error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      throw new Error('Could not access the job link. Please check the URL and try again.');
    }
    throw new Error('Could not scrape the page. The page may be protected or unavailable.');
  } finally {
    if (browser) {
      console.log('Closing browser...');
      await browser.close();
    }
  }
}

module.exports = { scrapeJobDescription };