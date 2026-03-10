import puppeteer from 'puppeteer';

export const browseWebTool = {
  name: "browse_web",
  description: "Visits a URL and returns a summary of the web page content. Use this to find information or check the web apps you build.",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL to visit." }
    },
    required: ["url"]
  },
  execute: async ({ url }: { url: string }) => {
    let browser;
    try {
      console.log(`🌐 Browsing: ${url}`);
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Get page title and text content
      const title = await page.title();
      const text = await page.evaluate(() => document.body.innerText.slice(0, 5000));
      
      return `Title: ${title}\n\nContent:\n${text}\n\n(Truncated to 5000 characters)`;
    } catch (error: any) {
      return `Error browsing ${url}: ${error.message}`;
    } finally {
      if (browser) await browser.close();
    }
  }
};
