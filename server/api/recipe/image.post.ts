import { consola } from 'consola';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { recipeSchema } from '~/server/utils/recipeSchema';

// Get OpenAI API key from runtime config
const runtimeConfig = useRuntimeConfig();

// Define the expected structure for the request body (multipart/form-data)
// Nitro/h3 automatically handles multipart/form-data parsing
// We expect a field named 'image' containing the file
interface ImageRequestBody {
  image: File; // This will be a File object provided by Nitro
}

// Define the system prompt for the AI
const systemPrompt = `You are a helpful assistant specialized in extracting recipes from images. Analyze the provided image and generate a structured recipe in JSON format based on the image content. The JSON object must strictly adhere to the following Zod schema:

${JSON.stringify(recipeSchema.shape, null, 2)}

If the image does not contain a recognizable recipe, try to figure out what the food depicted is and generate a recipe for that. Also ensure the recipe adheres to the schema.

Ensure that all fields are filled out in Dutch at all times.
Ensure the output is ONLY the JSON object.

`;

export default defineEventHandler(async (event) => {
  try {
    // Read the multipart/form-data body
    const body = await readMultipartFormData(event);

    // Find the image file part
    const imagePart = body?.find((part) => part.name === 'image');

    if (
      !imagePart ||
      !imagePart.data ||
      !imagePart.type?.startsWith('image/')
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Bad Request: Missing or invalid image file in the request.',
      });
    }

    // Convert the Buffer to a base64 string for OpenAI Vision API
    const base64Image = imagePart.data.toString('base64');
    const mimeType = imagePart.type;
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // Prepare the message for the OpenAI API (structure for generateObject)
    const userMessageContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: URL | Buffer | string }
    > = [
      {
        type: 'text',
        text: 'Extract the recipe from this image as JSON, following the schema.',
      },
      {
        type: 'image',
        image: imageUrl,
      },
    ];

    console.log(
      'Sending image to OpenAI Vision for object generation...'
    );

    // Use generateObject instead of streamText
    const { object: recipe } = await generateObject({
      model: openai('gpt-4o'), // Or your preferred vision-capable model
      schema: recipeSchema, // Provide the Zod schema directly
      messages: [{ role: 'user', content: userMessageContent }],
      system: systemPrompt,
      // mode: 'json' // Optional: Specify JSON mode if needed
    });

    console.log(
      'Successfully generated recipe object from OpenAI:',
      recipe
    );

    // The 'recipe' object is already validated against the schema by generateObject
    // We can directly return it.
    return { recipe };
  } catch (error: any) {
    console.error('Error processing image recipe request:', error);

    // Check if it's an h3 error from file reading/parsing
    if (error.statusCode && error.statusMessage) {
      throw error; // Re-throw h3 errors directly
    }

    // Handle potential errors from generateObject (e.g., AI couldn't generate valid JSON)
    // These might not be ZodErrors directly, but other error types from the AI SDK
    let statusCode = 500;
    let statusMessage =
      'Internal Server Error: Could not generate recipe from image.';

    // Add more specific error handling based on `error.name` or `error.cause` if needed
    if (error.message?.includes('schema validation failed')) {
      statusMessage =
        'AI failed to generate a recipe matching the required format.';
    }

    throw createError({
      statusCode,
      statusMessage,
      data: { originalError: error.message }, // Include original error message
    });
  }
});
