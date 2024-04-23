import axios from 'axios';
import { parse } from 'node-html-parser';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logLevel: 'INFO',
});

// Function to handle sending a message
export async function retrieveHomePageContent(): Promise<string> {
  try {
    // const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const targetUrl = 'https://www.botsandbytes.de/#';
    const response = await axios.get<string>(targetUrl);

    const websiteContent = extractTextFromHTML(response.data);
    const extractedUrls = extractUrlsFromHTML(response.data);
    let combinedUrlTextContent = '';

    for (const url of extractedUrls) {
      try {
        const urlHtmlContent = await fetchHtmlContent(url);
        const urlTextContent = extractTextFromHTML(urlHtmlContent);
        combinedUrlTextContent += urlTextContent + '\n';
      } catch (error) {
        logger.error(`Error fetching HTML content for ${url}`);
      }
    }

    const completeWebsiteContent =
      websiteContent + '\n' + combinedUrlTextContent;
    logger.debug('Complete website content:', completeWebsiteContent);

    return completeWebsiteContent;
  } catch (error) {
    const errMsg = `Error retrieving homepage content: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }
}

function extractTextFromHTML(html: string) {
  const root = parse(html);
  return root.querySelector('body')!.textContent;
}

// Fetch HTML content from a provided URL
async function fetchHtmlContent(url: string): Promise<string> {
  try {
    const response = await axios.get<string>(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    );
    return response.data;
  } catch (error) {
    const errMsg = `Error fetching HTML content for ${url}: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errMsg);
    throw new Error('Unable to fetch website content');
  }
}

// Extract URLs from HTML text using jsdom
function extractUrlsFromHTML(html: string): string[] {
  const regex = /href="#\/blog\/([^"]+)"/g;
  const matches = html.match(regex) || [];
  const urls: string[] = matches.map(
    (match) =>
      `https://www.botsandbytes.de/#${match.replace('href="#', '').replace('"', '')}`,
  );
  return urls;
}
