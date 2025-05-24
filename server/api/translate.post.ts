import { consola } from 'consola';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const systemPrompt = `
  You are a helpful assistant specialized in extracting and translating text from images. 

  Your task is to:
  1. Analyze the provided image and extract ALL visible text from it
  2. Translate the extracted text to Dutch
  3. Preserve the original formatting and structure as much as possible
  4. If no text is found, respond with "Geen tekst gevonden in de afbeelding"
  5. If the text is already in Dutch, simply return the text as is
  6. Respond ONLY with the translated Dutch text, no additional explanations or comments

  Rules:
  - Always translate to Dutch
  - Maintain line breaks and structure where logical
  - If there are multiple separate text elements, separate them clearly
  - Be accurate and natural in your Dutch translation
  - Do not add any explanations about what you're doing
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
        text: 'Extract and translate all text from this image to Dutch.',
      },
      {
        type: 'image',
        image: imageUrl,
      },
    ];

    consola.info(
      'Sending image to OpenAI Vision for text extraction and translation...'
    );

    // Use generateText to get the translation
    const { text: translation } = await generateText({
      model: openai('gpt-4.1'), // Using gpt-4o-mini as requested
      messages: [{ role: 'user', content: userMessageContent }],
      system: systemPrompt,
    });

    consola.info(
      'Successfully extracted and translated text from image'
    );

    // Return only the translation
    return {
      translation: translation.trim(),
    };
  } catch (error: any) {
    consola.error(
      'Error processing image translation request:',
      error
    );

    // Check if it's an h3 error from file reading/parsing
    if (error.statusCode && error.statusMessage) {
      throw error; // Re-throw h3 errors directly
    }

    // Handle potential errors from OpenAI API
    let statusCode = 500;
    let statusMessage =
      'Internal Server Error: Could not translate image.';

    // Add more specific error handling
    if (error.message?.includes('API key')) {
      statusMessage = 'OpenAI API configuration error.';
    } else if (error.message?.includes('rate limit')) {
      statusMessage =
        'Translation service temporarily unavailable. Please try again later.';
    } else if (error.message?.includes('content policy')) {
      statusMessage = 'Image content not suitable for translation.';
    }

    throw createError({
      statusCode,
      statusMessage,
      data: { message: statusMessage },
    });
  }
});
