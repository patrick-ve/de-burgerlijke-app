import { consola } from 'consola';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  GoogleAIFileManager,
  FileState,
  type UploadFileResponse,
} from '@google/generative-ai/server';
import { join } from 'node:path';
import {
  mkdirSync,
  unlinkSync,
  promises as fs,
  createWriteStream,
} from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { recipeSchema } from '~/server/utils/recipeSchema';
import { ingredientCategories } from '~/types/recipe'; // Import the RENAMED (simplified) categories

// --- Input Schema ---
const inputSchema = z
  .object({
    url: z.string().url().describe('YouTube video URL'),
  })
  .describe('Schema for validating the YouTube URL input');

// --- Interfaces ---
interface YouTubeDownloadResponse {
  url: string;
  expiresAt: string; // Consider checking expiry if needed
}

// --- Helper Functions ---

/**
 * Downloads audio from a YouTube URL using RapidAPI.
 * @param youtubeUrl - The URL of the YouTube video.
 * @param rapidApiKey - The RapidAPI key.
 * @param outputPath - The local path to save the downloaded audio.
 */
async function downloadYouTubeAudio(
  youtubeUrl: string,
  rapidApiKey: string,
  outputPath: string
): Promise<void> {
  if (!rapidApiKey) {
    throw new Error('RapidAPI key is missing.');
  }

  let videoId: string | undefined;
  try {
    const url = new URL(youtubeUrl);
    if (url.hostname === 'youtu.be') {
      videoId = url.pathname.slice(1).split('?')[0]; // Get path after '/' and remove query params
    } else if (
      url.hostname === 'www.youtube.com' ||
      url.hostname === 'youtube.com' ||
      url.hostname === 'm.youtube.com'
    ) {
      videoId = url.searchParams.get('v') ?? undefined;
    }
  } catch (e) {
    // Handle invalid URL format if needed, but Zod validation should catch most
    consola.error('Error parsing YouTube URL:', e);
  }

  if (!videoId) {
    throw new Error(
      'Invalid YouTube URL: Could not extract video ID from the provided URL.'
    );
  }

  try {
    consola.info(`Fetching download link for video ID: ${videoId}`);
    const downloadLinkResponse = await fetch(
      `https://youtube-search-download3.p.rapidapi.com/v1/download?v=${videoId}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host':
            'youtube-search-download3.p.rapidapi.com',
        },
      }
    );

    if (!downloadLinkResponse.ok) {
      throw new Error(
        `RapidAPI download link request failed with status ${downloadLinkResponse.status}: ${await downloadLinkResponse.text()}`
      );
    }

    const downloadData =
      (await downloadLinkResponse.json()) as YouTubeDownloadResponse;
    consola.info('Download URL response received.');

    if (!downloadData.url) {
      throw new Error(
        'No download URL found in the RapidAPI response.'
      );
    }

    consola.info(
      'Attempting to download audio from:',
      downloadData.url
    );
    const audioResponse = await fetch(downloadData.url, {
      // Headers might be needed depending on the download server's requirements
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });

    if (!audioResponse.ok || !audioResponse.body) {
      consola.error(
        'Audio download failed. Status:',
        audioResponse.status
      );
      consola.error(
        'Audio download response headers:',
        Object.fromEntries(audioResponse.headers.entries())
      );
      throw new Error(
        `Audio download failed with status ${audioResponse.status}`
      );
    }

    if (!audioResponse.body) {
      throw new Error('Audio response body is null.');
    }
    // Convert web stream to Node.js stream before piping
    await pipeline(
      Readable.fromWeb(
        audioResponse.body as import('stream/web').ReadableStream<Uint8Array>
      ),
      createWriteStream(outputPath)
    );

    consola.info(`Audio download complete. Saved to: ${outputPath}`);
  } catch (error) {
    consola.error('Error downloading YouTube audio:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown download error';
    throw new Error(`Failed to download YouTube audio: ${message}`);
  }
}

/**
 * Retries an async operation with exponential backoff.
 * @param operation - The async function to retry.
 * @param maxRetries - Maximum number of retries.
 * @param initialDelayMs - Initial delay in milliseconds.
 * @param maxDelayMs - Maximum delay in milliseconds.
 */
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 60000, // 1 minute
  maxDelayMs: number = 300000 // 5 minutes
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check for specific rate limit or retryable errors from Google AI
      if (
        error instanceof Error &&
        (error.message.includes('429') ||
          error.message.includes('503') || // Service Unavailable
          error.message.includes('server error')) // Generic server error
      ) {
        const delay = Math.min(
          initialDelayMs * Math.pow(2, attempt),
          maxDelayMs
        );
        consola.warn(
          `Google AI API error (${
            error.message.split(':')[0] // Log error type
          }), attempt ${
            attempt + 1
          }/${maxRetries}. Retrying in ${delay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // Retry the operation
      }

      // If it's not a retryable error, throw immediately
      throw error;
    }
  }

  throw (
    lastError || new Error(`Max retries (${maxRetries}) exceeded.`)
  );
}

/**
 * Uploads an audio file to Google AI and waits for processing.
 * @param audioPath - Path to the local audio file.
 * @param fileManager - Initialized GoogleAIFileManager instance.
 * @returns The processed Google AI File object.
 */
async function uploadAudioToGoogleAI(
  audioPath: string,
  fileManager: GoogleAIFileManager
): Promise<UploadFileResponse['file']> {
  consola.info(`Uploading audio file: ${audioPath} to Google AI...`);
  const uploadResult = await fileManager.uploadFile(audioPath, {
    mimeType: 'audio/mp3', // Assuming MP3, adjust if necessary
    displayName: `recipe-audio-${Date.now()}`,
  });
  consola.info(
    `File uploaded: ${uploadResult.file.name}. Waiting for processing...`
  );

  let file = await fileManager.getFile(uploadResult.file.name);
  const maxWaitTime = 300_000; // 5 minutes max wait
  const pollInterval = 10_000; // 10 seconds
  let waitedTime = 0;

  while (
    file.state === FileState.PROCESSING &&
    waitedTime < maxWaitTime
  ) {
    consola.info(
      `File ${file.name} is still processing. Waiting ${
        pollInterval / 1000
      }s...`
    );
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    waitedTime += pollInterval;
    try {
      file = await fileManager.getFile(uploadResult.file.name);
    } catch (getFileError) {
      consola.error(
        `Error checking file status for ${file.name}:`,
        getFileError
      );
      // Decide if this error is fatal or worth retrying the getFile status check
      if (waitedTime >= maxWaitTime) {
        // Avoid infinite loops if getFile keeps failing near the end
        throw new Error(
          `Error fetching file status and exceeded max wait time for ${file.name}.`
        );
      }
      // Optionally add a small delay before retrying getFile
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (file.state === FileState.FAILED) {
    consola.error(`File processing failed: ${file.name}`);
    // Attempt to delete the failed file from Google AI storage
    try {
      await fileManager.deleteFile(uploadResult.file.name);
      consola.info(`Deleted failed Google AI file: ${file.name}`);
    } catch (deleteError) {
      consola.error(
        `Failed to delete failed Google AI file ${file.name}:`,
        deleteError
      );
    }
    throw new Error(
      `Processing failed for Google AI file ${file.name}`
    );
  }

  if (file.state !== FileState.ACTIVE) {
    consola.error(
      `File ${file.name} is in unexpected state: ${file.state} after waiting.`
    );
    throw new Error(
      `Google AI file ${file.name} did not become active within the time limit.`
    );
  }

  consola.info(
    `File ${file.name} is active and ready for transcription.`
  );
  return file;
}

/**
 * Transcribes audio using Google Gemini.
 * @param googleAiFile - The processed Google AI File object.
 * @param genAI - Initialized GoogleGenerativeAI instance.
 * @returns The raw transcript text.
 */
async function transcribeAudio(
  googleAiFile: UploadFileResponse['file'],
  genAI: GoogleGenerativeAI
): Promise<string> {
  consola.info(
    `Starting transcription for Google AI file: ${googleAiFile.name}`
  );
  // Use gemini-1.5-pro for potentially better transcription quality and longer context
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'text/plain', // Get raw transcript
    },
  });

  try {
    // Use retry logic for the transcription call
    const result = await retryWithExponentialBackoff(async () => {
      consola.info(`Calling Gemini 2.0 Flash for transcription...`);
      const genResult = await model.generateContent([
        {
          fileData: {
            mimeType: googleAiFile.mimeType,
            fileUri: googleAiFile.uri,
          },
        },
        {
          text: 'Transcribe the audio content into plain text. Provide only the raw transcript, without any additional formatting, commentary, or timestamps.',
        },
      ]);
      return genResult;
    });

    const transcript = result.response.text();
    consola.info('Transcription successful.');
    // consola.info('Raw Transcript:', transcript); // Log transcript for debugging if needed
    return transcript;
  } catch (error) {
    consola.error('Error during Gemini transcription:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown transcription error';
    throw new Error(`Failed to transcribe audio: ${message}`);
  }
}

/**
 * Deletes a file from Google AI storage safely.
 * @param fileName - The name of the file to delete (e.g., 'files/abc123xyz').
 * @param fileManager - Initialized GoogleAIFileManager instance.
 */
async function deleteGoogleAIFile(
  fileName: string,
  fileManager: GoogleAIFileManager
): Promise<void> {
  try {
    await fileManager.deleteFile(fileName);
    consola.info(`Successfully deleted Google AI file: ${fileName}`);
  } catch (deleteError) {
    consola.error(
      `Error deleting Google AI file ${fileName}:`,
      deleteError
    );
    // Log the error but don't throw, as the main goal (transcription/recipe extraction) might have succeeded.
  }
}

/**
 * Deletes a local file safely.
 * @param filePath - The path to the local file to delete.
 */
async function deleteLocalFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    consola.info(`Successfully deleted local file: ${filePath}`);

    // Optional: Attempt to remove the temp directory if it's empty
    const tmpDir = join(process.cwd(), 'tmp');
    try {
      const files = await fs.readdir(tmpDir);
      if (files.length === 0) {
        await fs.rmdir(tmpDir);
        consola.info(
          `Successfully removed empty temp directory: ${tmpDir}`
        );
      }
    } catch (rmdirError) {
      // Ignore error if the directory is not empty or cannot be removed
      consola.warn(
        `Could not remove temp directory ${tmpDir}:`,
        rmdirError
      );
    }
  } catch (error) {
    // Log the error but don't necessarily throw, cleanup failure shouldn't break the request
    consola.error(`Error deleting local file ${filePath}:`, error);
  }
}

/**
 * Creates the system prompt for OpenAI recipe extraction from transcript.
 */
function createSystemPromptForTranscript(): string {
  const categoryList = ingredientCategories.join(', '); // Use RENAMED (simplified) list

  return `
You are an expert in analyzing recipe transcripts. You are given a raw text transcript potentially containing a recipe spoken aloud.
You must:

1. Extract the recipe content according to the specified schema.
2. Structure it according to the specified schema.
3. Convert measurements to Dutch standard units.
4. Ensure all numeric values are actual numbers.
5. Translate all values of the schema to Dutch.
6. Use Dutch measurement units (ml, l, el, tl, kop, g, kg, stuk, teen, snuf, mespunt, plak, bol, takje, blaadje, scheut, handvol). Allow null for unit if not applicable.
7. Identify any steps mentioning timers (e.g., "cook for 10 minutes") and include the duration in milliseconds in the 'timer' property of the step. 1 minute = 60000 milliseconds.
8. For each ingredient, assign a category from the following list: ${categoryList}. If no specific category fits, use 'Other'. Set the category field to null if it cannot be determined.
9. Extract the recipe's 'title' from the transcript. Omit words like "Recept" or "Recipe".
10. Extract the number of 'portions' if mentioned. Default to 1 if not specified.
11. Infer 'prepTime' and 'cookTime' in minutes if mentioned or implied.
12. Try to identify the 'cuisine' type if mentioned.
13. Extract the author name from the recipe if it is present. If it is not present, set the authorName field to null.
14. Determine if the recipe is vegetarian. If it is, set the isVegetarian field to true. If it is not, set the isVegetarian field to false.

Focus solely on the recipe information within the transcript. Ignore conversational filler, introductions, or unrelated content unless it directly describes the recipe.

Keep the response concise and clear.

Respond with a valid JSON object that matches this TypeScript interface:

interface Recipe {
  // Title of the recipe, omit the word "Recept" or "Recipe" in this field.
  title: string

  // Optional description of the recipe (can be null)
  description?: string | null

  // List of ingredients
  ingredients: Array<{
    // Amount of the ingredient (positive number or null)
    quantity: number | null
    // Unit of measurement for the ingredient (can be null)
    // Examples: "ml", "l", "el", "tl", "kop", "g", "kg", "stuk", "teen", "plak", "bol", "snuf", "mespunt", "takje", "blaadje", "scheut", "handvol"
    unit: string | null
    // Name of the ingredient
    name: string
    // Optional notes for the ingredient (can be null)
    notes?: string | null
    // Category of the ingredient (must be one of: ${categoryList}, or null)
    category?: string | null
  }>

  // List of preparation steps.
  steps: Array<{
    // Sequence number of the preparation step
    order: number
    // Description of the preparation step
    description: string
    // Timer in milliseconds for this step (can be null).
    timer?: number | null
  }>

  // Optional preparation time in minutes (can be null)
  prepTime?: number | null

  // Optional cooking time in minutes (can be null)
  cookTime?: number | null

  // Type of cuisine (e.g., Dutch, Italian) (can be null)
  cuisine?: string | null

  // Number of portions this recipe yields (must be a positive number)
  portions: number

  // Optional source URL of the recipe (can be null) - Should be the original YouTube URL
  sourceUrl?: string | null

  // Optional YouTube URL for the recipe (can be null) - Should be the original YouTube URL
  youtubeUrl?: string | null

  // Optional image URL for the recipe (can be null) - Cannot be reliably extracted from audio
  imageUrl?: string | null
}
`;
}

// --- Event Handler ---
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { googleAiApiKey, openaiApiKey, rapidApiKeyYoutube } = config; // Ensure these are defined in your nuxt.config

  if (!googleAiApiKey || !openaiApiKey || !rapidApiKeyYoutube) {
    consola.error('Missing API keys in runtime config.');
    throw createError({
      statusCode: 500,
      message: 'Server error occured.',
    });
  }

  let tempFilePath: string | null = null;
  let googleAiFileName: string | null = null;

  try {
    // 1. Validate Input
    const body = await readBody(event);
    const { url: youtubeUrl } = inputSchema.parse(body);
    consola.info(`Received request for YouTube URL: ${youtubeUrl}`);

    // 2. Prepare Temp Directory & File Path
    const tmpDir = join(process.cwd(), 'tmp');
    mkdirSync(tmpDir, { recursive: true });
    tempFilePath = join(tmpDir, `youtube-audio-${Date.now()}.mp3`);

    // 3. Download Audio
    consola.info('Starting audio download...');
    await downloadYouTubeAudio(
      youtubeUrl,
      rapidApiKeyYoutube,
      tempFilePath
    );
    consola.info('Audio download finished.');

    // 4. Initialize Google AI Clients
    const fileManager = new GoogleAIFileManager(googleAiApiKey);
    const genAI = new GoogleGenerativeAI(googleAiApiKey);

    // 5. Upload Audio to Google AI
    const googleAiFile = await uploadAudioToGoogleAI(
      tempFilePath,
      fileManager
    );
    googleAiFileName = googleAiFile.name; // Store name for cleanup

    // 6. Transcribe Audio
    const transcript = await transcribeAudio(googleAiFile, genAI);

    // 7. Clean up Google AI File (do this early after transcription)
    await deleteGoogleAIFile(googleAiFileName!, fileManager);
    googleAiFileName = null; // Mark as deleted

    // 8. Clean up Local Audio File (do this early after upload/transcription)
    await deleteLocalFile(tempFilePath);
    tempFilePath = null; // Mark as deleted

    // 9. Extract Recipe from Transcript using OpenAI
    consola.info('Extracting recipe from transcript using OpenAI...');
    const systemPrompt = createSystemPromptForTranscript();
    const { object: recipe } = await generateObject({
      model: openai('gpt-4.1-mini-2025-04-14'), // Use the same model as url.post.ts
      schema: recipeSchema,
      prompt: `${systemPrompt}

Transcript:
${transcript}`,
    });

    consola.info('Recipe extraction successful.');

    // 10. Enrich Recipe (add source/youtube URL)
    if (!recipe.sourceUrl) {
      recipe.sourceUrl = youtubeUrl;
    }
    if (!recipe.youtubeUrl) {
      recipe.youtubeUrl = youtubeUrl;
    }
    // Image URL cannot be derived from audio, leave as null unless schema requires it

    // 11. Return Recipe
    return {
      recipe,
    };
  } catch (error: any) {
    consola.error('Error processing YouTube recipe request:', error);

    // Ensure cleanup happens even on error
    if (googleAiFileName) {
      consola.info('Cleaning up Google AI file due to error...');
      // Need to re-initialize fileManager if error occurred before its creation scope ended
      const fileManager = new GoogleAIFileManager(googleAiApiKey);
      await deleteGoogleAIFile(googleAiFileName!, fileManager);
    }
    if (tempFilePath) {
      consola.info('Cleaning up local temp file due to error...');
      await deleteLocalFile(tempFilePath);
    }

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: `Invalid input: ${error.errors.map((e) => e.message).join(', ')}`,
      });
    }

    // Throw a generic server error for other issues
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to process YouTube recipe.',
    });
  }
});
