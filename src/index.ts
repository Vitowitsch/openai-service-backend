import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';
import { getAWSSecret } from './infrastructure';

const logger = new Logger({
  logLevel: 'INFO',
});

export async function handler(event: APIGatewayProxyEvent) {
  logger.info('Received event:', JSON.stringify(event));
  try {
    const openaiApiKey = getAWSSecret('apenai-gpt-token');
    const userPrompt = JSON.parse(event.body!).prompt;
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'gpt-3.5-turbo',
        prompt: userPrompt,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
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
