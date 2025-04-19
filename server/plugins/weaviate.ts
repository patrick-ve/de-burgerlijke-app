import weaviate, {
  type WeaviateClient,
  ApiKey,
} from 'weaviate-client';

// Define an interface for the structure we expect in runtime config
interface RuntimeConfig {
  public: {
    weaviateUrl?: string;
  };
  weaviateApiKey?: string;
  openaiApiKey?: string;
}

let weaviateClientInstance: WeaviateClient | null = null;

export default defineNitroPlugin(async (nitroApp) => {
  // Initialize client only once
  if (weaviateClientInstance) {
    // Inject the existing instance into the context for this request
    nitroApp.hooks.hook('request', (event) => {
      event.context.weaviate = weaviateClientInstance;
    });
    console.log('Reusing existing Weaviate client instance.');
    return;
  }

  console.log('Initializing Weaviate client plugin...');
  const config = useRuntimeConfig() as RuntimeConfig;

  const weaviateUrl = config.public?.weaviateUrl;
  const weaviateApiKey = config.weaviateApiKey;
  const openaiApiKey = config.openaiApiKey;

  if (!weaviateUrl || !weaviateApiKey || !openaiApiKey) {
    console.error(
      'Weaviate/OpenAI configuration missing in runtime config. Weaviate client not initialized.'
    );
    // Inject null or a placeholder that throws an error if accessed
    nitroApp.hooks.hook('request', (event) => {
      event.context.weaviate = null; // Or throw new Error('Weaviate client not configured')
    });
    return;
  }

  try {
    console.log(
      `Attempting to connect to Weaviate at ${weaviateUrl}`
    );
    const client = await weaviate.connectToWeaviateCloud(
      weaviateUrl,
      {
        authCredentials: new ApiKey(weaviateApiKey),
        headers: {
          'X-OpenAI-Api-Key': openaiApiKey,
        },
      }
    );

    if (!(await client.isLive())) {
      throw new Error('Weaviate client connected but is not live.');
    }

    weaviateClientInstance = client;
    console.log('Weaviate client initialized successfully.');

    // Inject the client instance into the context for all requests
    nitroApp.hooks.hook('request', (event) => {
      event.context.weaviate = weaviateClientInstance;
    });

    // Optional: Close the client on app shutdown
    nitroApp.hooks.hook('close', async () => {
      if (weaviateClientInstance) {
        console.log('Closing Weaviate client...');
        await weaviateClientInstance.close();
        weaviateClientInstance = null;
      }
    });
  } catch (error) {
    console.error('Failed to initialize Weaviate client:', error);
    // Inject null or a placeholder in case of initialization error
    nitroApp.hooks.hook('request', (event) => {
      event.context.weaviate = null;
    });
  }
});

// Extend the H3EventContext interface to include the weaviate client
declare module 'h3' {
  interface H3EventContext {
    weaviate: WeaviateClient | null;
  }
}
