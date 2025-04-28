import { ref, onUnmounted, type Ref } from 'vue';

interface UseWebcamReturn {
  videoElementRef: Ref<HTMLVideoElement | null>;
  canvasElementRef: Ref<HTMLCanvasElement | null>;
  isStreaming: Ref<boolean>;
  error: Ref<string | null>;
  capturedImageDataUrl: Ref<string | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureSnapshot: () => Promise<File | null>;
}

export function useWebcam(): UseWebcamReturn {
  const videoElementRef = ref<HTMLVideoElement | null>(null);
  const canvasElementRef = ref<HTMLCanvasElement | null>(null);
  const isStreaming = ref(false);
  const error = ref<string | null>(null);
  const capturedImageDataUrl = ref<string | null>(null); // For preview
  let stream: MediaStream | null = null;

  const startCamera = async (): Promise<void> => {
    error.value = null;
    capturedImageDataUrl.value = null; // Clear previous capture
    isStreaming.value = false;

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      error.value = 'Jouw browser ondersteunt de camera API niet.';
      console.error('getUserMedia not supported');
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera
        audio: false,
      });

      if (videoElementRef.value) {
        videoElementRef.value.srcObject = stream;
        videoElementRef.value.onloadedmetadata = () => {
          videoElementRef.value?.play();
          isStreaming.value = true;
          console.log('Camera stream started');
        };
      } else {
        throw new Error('Video element not available.');
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        error.value =
          'Camera toegang geweigerd. Sta toegang toe in je browserinstellingen.';
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        error.value =
          'Geen geschikte camera gevonden. Zorg dat een camera is aangesloten en ingeschakeld.';
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        error.value =
          'Kon de camera niet starten. Is deze al in gebruik door een andere app?';
      } else {
        error.value =
          'Kon de camera niet starten door een onbekende fout.';
      }
      stopCamera(); // Clean up if start failed
    }
  };

  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      console.log('Camera stream stopped');
    }
    if (videoElementRef.value) {
      videoElementRef.value.srcObject = null;
    }
    stream = null;
    isStreaming.value = false;
  };

  const captureSnapshot = async (): Promise<File | null> => {
    if (
      !isStreaming.value ||
      !videoElementRef.value ||
      !canvasElementRef.value
    ) {
      console.error('Cannot capture: stream or elements not ready.');
      return null;
    }

    const video = videoElementRef.value;
    const canvas = canvasElementRef.value;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Could not get canvas context.');
      return null;
    }

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data URL for preview
    capturedImageDataUrl.value = canvas.toDataURL('image/jpeg'); // Or 'image/png'

    // Convert canvas to Blob, then to File
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `fridge-scan-${Date.now()}.jpg`;
            const file = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(file);
          } else {
            console.error('Failed to create blob from canvas.');
            resolve(null);
          }
        },
        'image/jpeg',
        0.9 // Quality factor (0 to 1)
      );
    });
  };

  // Cleanup when the component using the composable is unmounted
  onUnmounted(() => {
    stopCamera();
  });

  return {
    videoElementRef,
    canvasElementRef,
    isStreaming,
    error,
    capturedImageDataUrl,
    startCamera,
    stopCamera,
    captureSnapshot,
  };
}
