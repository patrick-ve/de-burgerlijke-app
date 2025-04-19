import weaviate, { type WeaviateClient } from 'weaviate-client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Define the structure of the properties expected for this query
interface ProductSupermarket {
  supermarketName?: string;
  // Add index signature for flexibility
  [key: string]: any;
}

async function listUniqueSupermarkets(
  client: WeaviateClient
): Promise<void> {
  console.log('Attempting to retrieve unique supermarket names...');

  if (!client) {
    console.error('Weaviate client is not initialized.');
    throw new Error('Weaviate client required');
  }

  try {
    const productsCollection =
      client.collections.get<ProductSupermarket>(
        'Products' // Assuming collection name is 'Products'
      );

    // Fetch objects, requesting only the supermarketName property
    // Setting a high limit to fetch as many as possible in one go.
    // Adjust if you have more than 10000 products.
    const response = await productsCollection.query.fetchObjects({
      limit: 10000,
      returnProperties: ['supermarketName'],
    });

    const supermarketNames = new Set<string>();

    response.objects.forEach((obj) => {
      if (obj.properties.supermarketName) {
        supermarketNames.add(obj.properties.supermarketName);
      }
    });

    if (supermarketNames.size > 0) {
      console.log('Unique supermarket names found:');
      supermarketNames.forEach((name) => console.log(`- ${name}`));
    } else {
      console.log(
        'No supermarket names found or collection is empty.'
      );
    }
  } catch (error: any) {
    console.error(
      'Error querying Weaviate for supermarket names:',
      error
    );
    throw new Error(`Weaviate query failed: ${error.message}`);
  }
}

// --- Main Execution ---
async function main() {
  const weaviateHost = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY; // Optional, depending on auth

  if (!weaviateHost) {
    console.error('WEAVIATE_HOST environment variable not set.');
    process.exit(1);
  }

  try {
    // Initialize Weaviate client
    // Adjust connection scheme and headers based on your Weaviate setup (e.g., WCS, local)
    const client: WeaviateClient =
      await weaviate.connectToWeaviateCloud(weaviateHost, {
        authCredentials: new weaviate.ApiKey(weaviateApiKey || ''), // Use API key if provided
        headers: {
          // Example header, adjust if needed, e.g., for OpenAI key
          // 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',
        },
      });

    // If using local Weaviate or different auth, adjust client initialization:
    // const client = await weaviate.connectToLocal();
    // or
    // const client = await weaviate.connectToWCS(weaviateHost, { /*...*/ });

    await listUniqueSupermarkets(client);
  } catch (error) {
    console.error('Failed to connect to or query Weaviate:', error);
    process.exit(1);
  }
}

main();
