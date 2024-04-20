import axios from 'axios';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  logLevel: 'INFO',
});

// Function to handle sending a message
export async function retrieveHomePageContent(): Promise<string> {
  try {
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const targetUrl = 'https://www.botsandbytes.de/#';
    const response = await axios.get<string>(
      proxyUrl + encodeURIComponent(targetUrl),
    );

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

// Extract text content from HTML string
function extractTextFromHTML(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Fetch HTML content from a provided URL
async function fetchHtmlContent(url: string): Promise<string> {
  try {
    const response = await axios.get<string>(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    // Assuming you have some way to update chat messages, you might need to pass this function or manage it differently
    // chatMessages.push({ role: 'assistant', content: 'Error: Unable to fetch website content.' });
    throw new Error('Unable to fetch website content');
  }
}

// Extract URLs from HTML text
function extractUrlsFromHTML(html: string): string[] {
  const regex = /href="#\/blog\/([^"]+)"/g;
  let matches;
  const urls: string[] = [];

  while ((matches = regex.exec(html)) !== null) {
    urls.push(`https://www.botsandbytes.de/#${matches[1]}`);
  }

  return urls;
}
