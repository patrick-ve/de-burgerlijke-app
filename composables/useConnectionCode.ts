import { ref, computed } from 'vue';
import type { ConnectionOffer } from './useWebRTCSync';

export function useConnectionCode() {
  const generatedCode = ref<string>('');
  const storedOffer = ref<ConnectionOffer | null>(null);
  const codeError = ref<string | null>(null);
  
  // Generate a readable connection code (format: BABY-XXXX-XXXX)
  const generateConnectionCode = (offer: ConnectionOffer): string => {
    // Create a unique code based on deviceId and timestamp
    const deviceIdHash = offer.deviceId.slice(-4).toUpperCase();
    const timestampHash = offer.timestamp.toString().slice(-4);
    
    // Generate additional random characters for uniqueness
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const code = `BABY-${deviceIdHash}-${timestampHash}-${randomPart}`;
    
    // Store the offer data associated with this code
    const codeData = {
      code,
      offer,
      timestamp: Date.now(),
    };
    
    // In a real implementation, you'd store this in a temporary server/database
    // For now, we'll use localStorage as a temporary solution
    localStorage.setItem(`connection-code-${code}`, JSON.stringify(codeData));
    
    generatedCode.value = code;
    storedOffer.value = offer;
    
    return code;
  };

  // Validate connection code format
  const validateCodeFormat = (code: string): boolean => {
    const codeRegex = /^BABY-[A-Z0-9]{4}-[0-9]{4}-[A-Z0-9]{4}$/;
    return codeRegex.test(code.trim().toUpperCase());
  };

  // Retrieve connection offer from code
  const getOfferFromCode = (code: string): ConnectionOffer | null => {
    try {
      codeError.value = null;
      
      const formattedCode = code.trim().toUpperCase();
      
      if (!validateCodeFormat(formattedCode)) {
        codeError.value = 'Ongeldige code format. Gebruik: BABY-XXXX-XXXX-XXXX';
        return null;
      }

      // Try to retrieve from localStorage
      const stored = localStorage.getItem(`connection-code-${formattedCode}`);
      if (!stored) {
        codeError.value = 'Code niet gevonden of verlopen';
        return null;
      }

      const codeData = JSON.parse(stored);
      
      // Check if code is not too old (expire after 10 minutes)
      const codeAge = Date.now() - codeData.timestamp;
      if (codeAge > 10 * 60 * 1000) {
        localStorage.removeItem(`connection-code-${formattedCode}`);
        codeError.value = 'Code is verlopen. Vraag een nieuwe code aan.';
        return null;
      }

      // Validate offer structure
      const offer = codeData.offer as ConnectionOffer;
      if (!offer.deviceId || !offer.offer || !offer.timestamp) {
        codeError.value = 'Ongeldige verbindingsgegevens';
        return null;
      }

      return offer;
    } catch (error) {
      console.error('Error retrieving offer from code:', error);
      codeError.value = 'Fout bij verwerken van code';
      return null;
    }
  };

  // Clean up expired codes from localStorage
  const cleanupExpiredCodes = () => {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith('connection-code-BABY-')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const codeData = JSON.parse(stored);
            const codeAge = now - codeData.timestamp;
            
            // Remove codes older than 10 minutes
            if (codeAge > 10 * 60 * 1000) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    });
  };

  // Format code for display (add dashes if not present)
  const formatCodeForDisplay = (code: string): string => {
    const cleaned = code.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    if (cleaned.length >= 16) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}`;
    }
    
    return cleaned;
  };

  // Check if a code is currently valid
  const isCodeValid = computed(() => {
    return generatedCode.value !== '' && storedOffer.value !== null;
  });

  // Clear current code and stored data
  const clearCode = () => {
    if (generatedCode.value) {
      localStorage.removeItem(`connection-code-${generatedCode.value}`);
    }
    generatedCode.value = '';
    storedOffer.value = null;
    codeError.value = null;
  };

  // Initialize cleanup on load
  cleanupExpiredCodes();

  return {
    // State
    generatedCode: readonly(generatedCode),
    storedOffer: readonly(storedOffer),
    codeError: readonly(codeError),
    isCodeValid,
    
    // Actions
    generateConnectionCode,
    getOfferFromCode,
    validateCodeFormat,
    formatCodeForDisplay,
    clearCode,
    cleanupExpiredCodes,
  };
}