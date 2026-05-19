import axios from 'axios';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/124.0.0.0 Safari/537.36';

export async function fetchPage(url: string): Promise<string> {
  const res = await axios.get(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Referer': 'https://morimichiichiba.jp/',
    },
    timeout: 15000,
  });
  return res.data;
}

export async function fetchPageWithBrowser(url: string): Promise<string> {
  // playwright headless fallback for 403 responses
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: BROWSER_UA });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function fetchPageSafe(url: string): Promise<string> {
  try {
    return await fetchPage(url);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      console.warn(`[fetchPage] 403 on ${url}, falling back to browser...`);
      return await fetchPageWithBrowser(url);
    }
    throw err;
  }
}
