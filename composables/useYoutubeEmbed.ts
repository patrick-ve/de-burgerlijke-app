import { computed } from 'vue';

/**
 * Extracts the YouTube video ID from various URL formats.
 * @param url - The YouTube URL.
 * @returns The video ID or null if not found.
 */
const getYoutubeVideoId = (url: string): string | null => {
  if (!url) {
    return null;
  }
  try {
    const urlObj = new URL(url);
    // Standard watch?v=VIDEO_ID format
    if (
      urlObj.pathname === '/watch' &&
      urlObj.searchParams.has('v')
    ) {
      return urlObj.searchParams.get('v');
    }
    // Shortened youtu.be/VIDEO_ID format
    if (
      urlObj.hostname === 'youtu.be' &&
      urlObj.pathname.length > 1
    ) {
      return urlObj.pathname.substring(1);
    }
    // Embed format /embed/VIDEO_ID
    if (urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.substring('/embed/'.length);
    }
    // Shorts format /shorts/VIDEO_ID
    if (urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.substring('/shorts/'.length);
    }
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null; // Invalid URL format
  }
  // Add more robust regex or checks if needed for edge cases
  console.warn('Could not extract YouTube video ID from URL:', url);
  return null;
};

/**
 * Composable to generate YouTube embed URL and check for validity.
 * @param youtubeUrl - Ref or reactive object containing the YouTube URL string.
 */
export function useYoutubeEmbed(
  youtubeUrl: Ref<string | null | undefined>
) {
  const videoId = computed(() =>
    getYoutubeVideoId(youtubeUrl.value ?? '')
  );

  const embedUrl = computed(() => {
    if (videoId.value) {
      // Construct the standard YouTube embed URL
      // Add modestbranding=1 to reduce YouTube logo visibility
      // Add rel=0 to prevent related videos from the same channel only
      return `https://www.youtube.com/embed/${videoId.value}?modestbranding=1&rel=0`;
    }
    return null;
  });

  const isValidYoutubeUrl = computed(() => !!videoId.value);

  return {
    embedUrl,
    isValidYoutubeUrl,
    videoId, // Expose videoId if needed elsewhere
  };
}
