import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Amazon Nova Micro model identifier - use inference profile for us-east-2
const NOVA_MICRO_MODEL_ID = process.env.AWS_REGION === 'us-east-2' 
  ? 'us.amazon.nova-micro-v1:0' // Inference profile format for us-east-2
  : 'amazon.nova-micro-v1:0';   // Direct model for other regions

// Initialize Bedrock client
const getBedrockClient = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // AWS SDK will automatically pick up credentials from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. IAM roles (if running on AWS)
  // 3. AWS credentials file
  return new BedrockRuntimeClient({ region });
};

export interface NovaRequest {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
}

export interface NovaResponse {
  text: string;
}

export const callNovaMicro = async ({
  systemPrompt,
  userMessage,
  temperature = 0,
  maxTokens = 4096
}: NovaRequest): Promise<NovaResponse> => {
  const client = getBedrockClient();

  // Amazon Nova Micro expects a specific message format
  const requestBody = {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: `${systemPrompt}\n\nUser request: ${userMessage}`
          }
        ]
      }
    ],
    inferenceConfig: {
      temperature,
      max_new_tokens: maxTokens
    }
  };

  try {
    const command = new InvokeModelCommand({
      modelId: NOVA_MICRO_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    const response = await client.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Nova Micro');
    }

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract text content from Nova response
    const text = responseBody?.output?.message?.content?.[0]?.text || '';
    
    if (!text) {
      console.warn('Nova Micro response structure:', JSON.stringify(responseBody, null, 2));
      throw new Error('No text content in Nova Micro response');
    }

    return { text };
  } catch (error: any) {
    console.error('Error calling Nova Micro:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationException') {
      throw new Error('Invalid request format for Nova Micro');
    } else if (error.name === 'ResourceNotFoundException') {
      throw new Error('Nova Micro model not found or not available in this region');
    } else if (error.name === 'AccessDeniedException') {
      throw new Error('Access denied to Nova Micro. Check AWS credentials and permissions.');
    } else if (error.name === 'ThrottlingException') {
      throw new Error('Request throttled by Nova Micro. Please try again later.');
    }
    
    throw new Error(`Nova Micro API error: ${error.message}`);
  }
};

// Helper function to check if Nova Micro is properly configured
export const isNovaConfigured = (): boolean => {
  // Check if required AWS credentials are available
  const hasCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  const hasRegion = process.env.AWS_REGION;
  
  return Boolean(hasCredentials || hasRegion); // IAM roles work without explicit credentials
};
