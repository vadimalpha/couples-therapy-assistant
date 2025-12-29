import OpenAI from 'openai';

/**
 * OpenAI Client Singleton
 *
 * Provides a single instance of the OpenAI SDK client
 * configured with API key from environment variables.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export default openai;
