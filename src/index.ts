import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';
import { getAWSSecret } from './infrastructure';
// import { retrieveHomePageContent } from './homepage_content';
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
    const { conversationHistory } = JSON.parse(event.body!).conversationHistory;
    logger.info('Conversation history:' + JSON.stringify(conversationHistory));
    logger.info('Conversation history2:' + conversationHistory);
    const systemMessage = {
      role: 'system',
      content: 'You are a helpful assistant.',
    };

    const messages = [systemMessage, ...conversationHistory];

    // function addArticlesToContext(articles) {
    //   articles.forEach((article) => {
    //     conversationHistory.push({
    //       role: "assistant",
    //       content: `Article: ${article.title}\n${article.content}`
    //     });
    //   });
    // }
    // ...conversationHistory];

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: openAiSecret.MODEL,
        max_tokens: 100,
        messages,
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
