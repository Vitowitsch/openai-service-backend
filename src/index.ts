import { APIGatewayProxyEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import OpenAI from 'openai';
import { getAWSSecret } from './infrastructure';

const logger = new Logger({
  logLevel: 'DEBUG',
});

interface OpenAiSecret {
  API_KEY: string;
  ASSISTENT_ID: string;
}

async function getOpenAIClient(): Promise<OpenAI> {
  const openAiSecret = await getAWSSecret<OpenAiSecret>('hpchatbot_secret');
  return new OpenAI({ apiKey: openAiSecret.API_KEY });
}

async function getOrCreateThreadId(
  openai: OpenAI,
  existingThreadId?: string,
): Promise<string> {
  if (existingThreadId) {
    logger.info(`Reusing existing thread: ${existingThreadId}`);
    return existingThreadId;
  }

  const thread = await openai.beta.threads.create();
  logger.info(`Created new thread: ${thread.id}`);
  return thread.id;
}

async function startAssistantRun(
  openai: OpenAI,
  threadId: string,
  assistantId: string,
) {
  logger.info(`Starting assistant run for thread: ${threadId}`);
  return await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
}

async function waitForAssistantResponse(
  openai: OpenAI,
  threadId: string,
  runId: string,
): Promise<boolean> {
  const MAX_RETRIES = 15;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (runStatus.status === 'completed') {
      return true;
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  logger.error(
    `Timeout reached: Assistant did not respond within ${MAX_RETRIES * 2} seconds.`,
  );
  return false;
}

async function fetchLatestAssistantMessage(
  openai: OpenAI,
  threadId: string,
): Promise<string> {
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messages.data.find(
    (msg) => msg.role === 'assistant',
  );

  if (!assistantMessage || !assistantMessage.content.length) {
    return 'No response generated';
  }

  return assistantMessage.content
    .map((content) => {
      if ('text' in content) return content.text; // Placeholder for images
      return '[Unsupported content type]';
    })
    .join('\n');
}

export async function handler(event: APIGatewayProxyEvent) {
  logger.info('Received event:', JSON.stringify(event));

  try {
    const openai = await getOpenAIClient();
    const openAiSecret = await getAWSSecret<OpenAiSecret>('hpchatbot_secret');

    const body = JSON.parse(event.body || '{}');
    const userMessage = body.user_input;
    const threadId = await getOrCreateThreadId(openai, body.thread_id);

    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user input' }),
      };
    }

    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: userMessage,
    });

    const run = await startAssistantRun(
      openai,
      threadId,
      openAiSecret.ASSISTENT_ID,
    );

    const completed = await waitForAssistantResponse(openai, threadId, run.id);
    if (!completed) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Assistant response timeout' }),
      };
    }

    const response = await fetchLatestAssistantMessage(openai, threadId);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
      },
      body: JSON.stringify({ thread_id: threadId, response }),
    };
  } catch (error) {
    logger.error('Error processing request', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
