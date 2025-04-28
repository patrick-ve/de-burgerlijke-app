import { consola } from 'consola';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { recipeSchema } from '~/server/utils/recipeSchema';

// Get OpenAI API key from runtime config
const runtimeConfig = useRuntimeConfig();

// Define the expected structure for the request body (multipart/form-data)
interface ImageRequestBody {
  image: File; // This will be a File object provided by Nitro
}

// Define the system prompt for the AI for fridge scanning
const systemPrompt = `You are a helpful assistant specialized in identifying ingredients from photos of fridge contents and generating recipes based on those ingredients. Analyze the provided image and identify edible items. Then, create a suitable recipe primarily using the identified ingredients. The generated recipe MUST be in JSON format and strictly adhere to the following Zod schema:

${JSON.stringify(recipeSchema.shape, null, 2)}

Prioritize using the ingredients visible in the image. If essential components for a reasonable recipe are missing, you may add a small number of common pantry staples (like oil, salt, pepper, basic spices).
If the image does not contain recognizable food items or ingredients, respond with an error or indicate that no recipe can be generated.
If the ingredients are very limited, try to suggest a simple recipe or snack.

Ensure that all fields in the JSON output are filled out in Dutch.
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

    // Prepare the message for the OpenAI API
    const userMessageContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; image: URL | Buffer | string }
    > = [
      {
        type: 'text',
        text: 'Identify ingredients in this image (fridge contents) and generate a suitable recipe using them, following the provided schema in Dutch.',
      },
      {
        type: 'image',
        image: imageUrl,
      },
    ];

    console.log(
      'Sending fridge image to OpenAI Vision for recipe generation...'
    );

    // Use generateObject with the recipe schema
    const { object: recipe } = await generateObject({
      model: openai('gpt-4o'), // Use a vision-capable model
      schema: recipeSchema,
      messages: [{ role: 'user', content: userMessageContent }],
      system: systemPrompt,
    });

    console.log(
      'Successfully generated recipe object from fridge scan:',
      recipe
    );

    // Return the validated recipe object
    return { recipe };
  } catch (error: any) {
    console.error(
      'Error processing fridge scan recipe request:',
      error
    );

    // Handle h3 errors (e.g., bad request)
    if (error.statusCode && error.statusMessage) {
      throw error;
    }

    // Handle potential errors from generateObject
    let statusCode = 500;
    let statusMessage =
      'Internal Server Error: Could not generate recipe from fridge image.';

    if (error.message?.includes('schema validation failed')) {
      statusMessage =
        'AI failed to generate a valid recipe matching the required format from the fridge contents.';
    } else if (
      error.message?.includes('No recognizable food items')
    ) {
      // Example custom error check
      statusCode = 400;
      statusMessage = 'Could not recognize ingredients in the image.';
    }

    throw createError({
      statusCode,
      statusMessage,
      data: { originalError: error.message },
    });
  }
});
