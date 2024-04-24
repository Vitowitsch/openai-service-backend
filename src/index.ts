import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';
import { getAWSSecret } from './infrastructure';
import { retrieveHomePageContent } from './homepage_content';
// import { retrieveHomePageContent } from './homepage_content';

const logger = new Logger({
  logLevel: 'DEBUG',
});

interface OpenAiSecret {
  GPT_TOKEN: string;
  MODEL: string;
}

export async function handler(event: APIGatewayProxyEvent) {
  logger.info('Received event:', JSON.stringify(event));
  try {
    const openAiSecret = await getAWSSecret<OpenAiSecret>('apenai-gpt-token');

    const websiteContent = await retrieveHomePageContent();

    const userMsg = JSON.parse(event.body!).text;

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: openAiSecret.MODEL,
        max_tokens: 100,
        messages: [
          { role: 'assistant', content: websiteContent },
          { role: 'user', content: userMsg },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiSecret.GPT_TOKEN}`,
        },
      },
    );
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
      },
      body: JSON.stringify(openaiResponse.data),
    };
  } catch (error) {
    const msg = `Error processing request: ${
      error instanceof Error ? error.message : String(error)
    }`;
    logger.error(msg);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: msg }),
    };
  }
}
