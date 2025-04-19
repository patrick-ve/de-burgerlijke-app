import weaviate, {
  type WeaviateClient,
  ApiKey,
} from 'weaviate-client';

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' }); // Assuming you use dotenv

let client: WeaviateClient;
// let response; // 'response' is not used outside searchMovies, declare inside

// Get the collection and perform query
async function searchProducts() {
  // Ensure client is initialized before using it
  if (!client) {
    console.error('Weaviate client is not initialized.');
    return;
  }

  const productsCollection = client.collections.get('Products');

  // Perform query - Adjusting query to match 'Products' collection
  const response = await productsCollection.query.nearText(
    'Jonge kaas', // Example query for products
    {
      limit: 10,
      returnMetadata: ['distance'],
      // Specify which properties to return if needed
      returnProperties: [
        'name',
        'amount',
        'price',
        'standardizedPricePerUnit',
        'standardizedUnit',
        'supermarketName',
      ],
      // filters: productsCollection.filter
      //   .byProperty('supermarketName')
      //   .equal('Albert Heijn'),
    }
  );

  // Inspect the response
  for (const item of response.objects) {
    const {
      properties: {
        supermarketName,
        name,
        price,
        standardizedPricePerUnit,
        standardizedUnit,
        amount,
      },
    } = item;

    // Print the distance of the object from the query
    // Handle potential undefined metadata and distance
    if (item.metadata && item.metadata.distance !== undefined) {
      const similarity = (1 - item.metadata.distance) * 100;
      console.log(
        `${supermarketName}: ${name} - €${price} - ${amount} - €${standardizedPricePerUnit}/${standardizedUnit} (${similarity.toFixed(2)}%)`
      );
    }
  }
}

// Main function to initialize client and run search
async function main() {
  try {
    // Instantiate your client
    client = await weaviate.connectToWeaviateCloud(
      process.env.WEAVIATE_URL as string,
      {
        authCredentials: new ApiKey(
          process.env.WEAVIATE_API_KEY as string
        ),
        headers: {
          'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY as string,
        },
      }
    );

    console.log('Weaviate client connected.');

    // Call the search function after client is initialized
    await searchProducts();
  } catch (error) {
    console.error('Failed to connect or search Weaviate:', error);
  } finally {
    // Optional: Close the client connection
    if (client) {
      await client.close();
      console.log('Weaviate client closed.');
    }
  }
}

// Run the main function
main();
