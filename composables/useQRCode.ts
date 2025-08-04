import { ref, computed } from 'vue';
import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';
import type { ConnectionOffer } from './useWebRTCSync';

export function useQRCode() {
  const isScanning = ref(false);
  const scanError = ref<string | null>(null);
  const hasCamera = ref(false);
  let qrScanner: QrScanner | null = null;

  // Check if camera is available
  const checkCameraAvailability = async () => {
    try {
      const hasCamera = await QrScanner.hasCamera();
      return hasCamera;
    } catch (error) {
      console.error('Error checking camera availability:', error);
      return false;
    }
  };

  // Generate QR code as data URL
  const generateQRCode = async (data: ConnectionOffer): Promise<string> => {
    try {
      const jsonData = JSON.stringify(data);
      const qrCodeDataURL = await QRCode.toDataURL(jsonData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  };

  // Generate QR code as SVG string
  const generateQRCodeSVG = async (data: ConnectionOffer): Promise<string> => {
    try {
      const jsonData = JSON.stringify(data);
      const qrCodeSVG = await QRCode.toString(jsonData, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      return qrCodeSVG;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  };

  // Start scanning QR code
  const startScanning = async (videoElement: HTMLVideoElement): Promise<void> => {
    try {
      scanError.value = null;
      
      // Check camera availability first
      hasCamera.value = await checkCameraAvailability();
      if (!hasCamera.value) {
        throw new Error('No camera available for QR scanning');
      }

      // Create QR scanner instance
      qrScanner = new QrScanner(
        videoElement,
        (result) => {
          try {
            // Try to parse the QR code data as ConnectionOffer
            const connectionOffer = JSON.parse(result.data) as ConnectionOffer;
            
            // Validate the structure
            if (!connectionOffer.deviceId || !connectionOffer.offer || !connectionOffer.timestamp) {
              throw new Error('Invalid QR code format');
            }

            // Dispatch custom event with the scanned data
            window.dispatchEvent(new CustomEvent('qr-code-scanned', {
              detail: connectionOffer
            }));

            // Stop scanning after successful scan
            stopScanning();
          } catch (error) {
            console.error('Error parsing QR code:', error);
            scanError.value = 'Invalid QR code format';
          }
        },
        {
          onDecodeError: (error) => {
            // Don't log decode errors as they're common during scanning
            // Just continue scanning
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );

      await qrScanner.start();
      isScanning.value = true;
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      scanError.value = error instanceof Error ? error.message : 'Failed to start camera';
      isScanning.value = false;
    }
  };

  // Stop scanning QR code
  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop();
      qrScanner.destroy();
      qrScanner = null;
    }
    isScanning.value = false;
    scanError.value = null;
  };

  // Parse QR code from image file
  const scanFromFile = async (file: File): Promise<ConnectionOffer> => {
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });

      const connectionOffer = JSON.parse(result.data) as ConnectionOffer;
      
      // Validate the structure
      if (!connectionOffer.deviceId || !connectionOffer.offer || !connectionOffer.timestamp) {
        throw new Error('Invalid QR code format');
      }

      return connectionOffer;
    } catch (error) {
      console.error('Error scanning QR code from file:', error);
      throw new Error('Failed to read QR code from image');
    }
  };

  // Check if device supports QR scanning
  const canScan = computed(() => {
    return QrScanner.hasCamera && 'mediaDevices' in navigator;
  });

  return {
    // State
    isScanning: readonly(isScanning),
    scanError: readonly(scanError),
    hasCamera: readonly(hasCamera),
    canScan,
    
    // Actions
    generateQRCode,
    generateQRCodeSVG,
    startScanning,
    stopScanning,
    scanFromFile,
    checkCameraAvailability,
  };
}