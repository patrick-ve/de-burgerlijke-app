<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { format } from 'date-fns';
import { useWebRTCSync } from '~/composables/useWebRTCSync';
import { useConnectionCode } from '~/composables/useConnectionCode';
import { useBaby } from '~/composables/useBaby';
import type { ConnectionOffer, ConnectionAnswer } from '~/composables/useWebRTCSync';

const router = useRouter();

// Composables
const { 
  connectionState, 
  isConnected, 
  isHost, 
  deviceId, 
  connectedDeviceId, 
  lastSyncTime,
  createOffer, 
  createAnswer, 
  completeConnection,
  sendSyncData,
  requestSync,
  disconnect 
} = useWebRTCSync();

const { 
  generatedCode, 
  codeError, 
  isCodeValid,
  generateConnectionCode, 
  getOfferFromCode, 
  validateCodeFormat,
  formatCodeForDisplay,
  clearCode 
} = useConnectionCode();

const { exportSyncData, hasUnsyncedChanges } = useBaby();

// UI State
const currentStep = ref<'menu' | 'host' | 'join' | 'connecting' | 'connected'>('menu');
const connectionCode = ref<string>('');
const inputCode = ref<string>('');
const connectionOffer = ref<ConnectionOffer | null>(null);
const syncStatus = ref<string>('');
const showConnectionCode = ref(false);
const showCodeInput = ref(false);

// Computed
const statusColor = computed(() => {
  switch (connectionState.value) {
    case 'connected': return 'green';
    case 'connecting': return 'yellow';
    case 'failed': return 'red';
    default: return 'gray';
  }
});

const statusText = computed(() => {
  switch (connectionState.value) {
    case 'connected': return 'Verbonden';
    case 'connecting': return 'Verbinden...';
    case 'failed': return 'Verbinding mislukt';
    default: return 'Niet verbonden';
  }
});

const canStartSync = computed(() => {
  return isConnected.value && hasUnsyncedChanges();
});

const formattedInputCode = computed(() => {
  return formatCodeForDisplay(inputCode.value);
});

// Host functions
const startAsHost = async () => {
  try {
    currentStep.value = 'host';
    syncStatus.value = 'Verbinding voorbereiden...';
    
    connectionOffer.value = await createOffer();
    connectionCode.value = generateConnectionCode(connectionOffer.value);
    showConnectionCode.value = true;
    
    syncStatus.value = 'Wacht op verbinding...';
  } catch (error) {
    console.error('Error starting as host:', error);
    syncStatus.value = 'Fout bij het maken van verbinding';
  }
};

// Join functions
const startAsClient = () => {
  currentStep.value = 'join';
  showCodeInput.value = true;
  syncStatus.value = 'Voer de verbindingscode in';
};

// Handle connection code input
const handleCodeSubmit = async () => {
  try {
    const code = inputCode.value.trim();
    
    if (!validateCodeFormat(code)) {
      syncStatus.value = 'Ongeldige code format';
      return;
    }
    
    const scannedOffer = getOfferFromCode(code);
    if (!scannedOffer) {
      syncStatus.value = codeError.value || 'Ongeldige code';
      return;
    }
    
    syncStatus.value = 'Verbinding maken...';
    currentStep.value = 'connecting';
    
    showCodeInput.value = false;
    
    const answer = await createAnswer(scannedOffer);
    
    // In a real implementation, you'd need to send this answer back to the host
    // For now, we'll simulate this by dispatching an event
    window.dispatchEvent(new CustomEvent('connection-answer', {
      detail: answer
    }));
    
    syncStatus.value = 'Verbonden! Klaar om te synchroniseren.';
    currentStep.value = 'connected';
  } catch (error) {
    console.error('Error handling code:', error);
    syncStatus.value = 'Fout bij het verbinden';
    currentStep.value = 'menu';
  }
};

// Handle connection answer (for host)
const handleConnectionAnswer = async (event: CustomEvent) => {
  if (!isHost.value || !connectionOffer.value) return;
  
  const answer = event.detail as ConnectionAnswer;
  
  try {
    await completeConnection(answer);
    syncStatus.value = 'Verbonden! Klaar om te synchroniseren.';
    currentStep.value = 'connected';
    showQRCode.value = false;
  } catch (error) {
    console.error('Error completing connection:', error);
    syncStatus.value = 'Fout bij het voltooien van verbinding';
  }
};

// Sync functions
const performSync = async () => {
  try {
    syncStatus.value = 'Synchroniseren...';
    
    const localData = exportSyncData();
    await sendSyncData(localData);
    
    syncStatus.value = 'Synchronisatie voltooid';
    
    // Clear status after 3 seconds
    setTimeout(() => {
      syncStatus.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error performing sync:', error);
    syncStatus.value = 'Synchronisatiefout';
  }
};

const requestSyncFromPeer = async () => {
  try {
    syncStatus.value = 'Synchronisatie aanvragen...';
    await requestSync();
    syncStatus.value = 'Synchronisatieverzoek verzonden';
    
    setTimeout(() => {
      syncStatus.value = '';
    }, 3000);
  } catch (error) {
    console.error('Error requesting sync:', error);
    syncStatus.value = 'Fout bij synchronisatieverzoek';
  }
};

// Navigation
const goBack = () => {
  if (currentStep.value === 'connected' || currentStep.value === 'menu') {
    router.push('/app/baby');
  } else {
    resetToMenu();
  }
};

const resetToMenu = () => {
  currentStep.value = 'menu';
  showConnectionCode.value = false;
  showCodeInput.value = false;
  inputCode.value = '';
  clearCode();
  syncStatus.value = '';
};

const handleDisconnect = () => {
  disconnect();
  resetToMenu();
};

// Event listeners
onMounted(() => {
  window.addEventListener('connection-answer', handleConnectionAnswer as EventListener);
});

onBeforeUnmount(() => {
  window.removeEventListener('connection-answer', handleConnectionAnswer as EventListener);
});

// Watch connection state
watch(connectionState, (state) => {
  if (state === 'connected' && currentStep.value !== 'connected') {
    currentStep.value = 'connected';
    syncStatus.value = 'Verbonden! Klaar om te synchroniseren.';
  } else if (state === 'failed') {
    syncStatus.value = 'Verbinding verbroken';
    currentStep.value = 'menu';
  }
});

// Page title
useHead({ title: 'Baby Synchronisatie' });
</script>

<template>
  <TheHeader title="Synchronisatie">
    <template #left-action>
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        aria-label="Back"
        @click="goBack"
      />
    </template>
  </TheHeader>

  <div class="pb-24 max-w-md mx-auto px-4 pt-4">
    <!-- Connection Status -->
    <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-medium text-gray-900">Verbindingsstatus</h3>
        <UBadge 
          :label="statusText" 
          :color="statusColor" 
          variant="subtle" 
        />
      </div>
      
      <div class="space-y-2 text-sm text-gray-600">
        <div class="flex justify-between">
          <span>Apparaat ID:</span>
          <span class="font-mono text-xs">{{ deviceId.slice(-8) }}</span>
        </div>
        
        <div v-if="connectedDeviceId" class="flex justify-between">
          <span>Verbonden met:</span>
          <span class="font-mono text-xs">{{ connectedDeviceId.slice(-8) }}</span>
        </div>
        
        <div v-if="lastSyncTime" class="flex justify-between">
          <span>Laatste sync:</span>
          <span>{{ format(lastSyncTime, 'HH:mm') }}</span>
        </div>
      </div>
      
      <div v-if="syncStatus" class="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
        {{ syncStatus }}
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-6">
      <!-- Menu Step -->
      <div v-if="currentStep === 'menu'" class="space-y-4">
        <div class="text-center mb-6">
          <UIcon name="i-heroicons-wifi" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Synchronisatie instellen</h2>
          <p class="text-gray-600">
            Verbind met het apparaat van je partner om melkgegevens te synchroniseren.
          </p>
        </div>

        <div class="space-y-3">
          <UButton
            label="Verbinding starten"
            icon="i-heroicons-key"
            size="lg"
            block
            @click="startAsHost"
            class="font-medium"
          />
          
          <UButton
            label="Verbinding maken"
            icon="i-heroicons-pencil-square"
            variant="outline"
            size="lg"
            block
            @click="startAsClient"
            class="font-medium"
          />
        </div>

      </div>

      <!-- Host Step - Show Connection Code -->
      <div v-if="currentStep === 'host' && showConnectionCode" class="text-center">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Verbindingscode</h2>
        <p class="text-gray-600 mb-6">
          Deel deze code met je partner om verbinding te maken.
        </p>
        
        <div class="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6">
          <div class="text-3xl font-mono font-bold text-gray-900 mb-2 tracking-wider">
            {{ connectionCode }}
          </div>
          <p class="text-sm text-gray-500">
            Code verloopt over 10 minuten
          </p>
        </div>
        
        <div class="space-y-3">
          <UButton
            label="Code kopiëren"
            icon="i-heroicons-clipboard-document"
            variant="outline"
            @click="() => navigator.clipboard?.writeText(connectionCode)"
          />
          
          <UButton
            label="Annuleren"
            variant="ghost"
            @click="resetToMenu"
          />
        </div>
      </div>

      <!-- Join Step - Enter Code -->
      <div v-if="currentStep === 'join' && showCodeInput" class="space-y-6">
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Verbindingscode invoeren</h2>
          <p class="text-gray-600 mb-6">
            Voer de code in die je van je partner hebt gekregen.
          </p>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Verbindingscode
            </label>
            <UInput
              v-model="inputCode"
              :value="formattedInputCode"
              placeholder="BABY-XXXX-XXXX-XXXX"
              size="lg"
              class="text-center font-mono tracking-wider"
              maxlength="19"
              @keyup.enter="handleCodeSubmit"
            />
            <p class="text-xs text-gray-500 mt-1">
              Format: BABY-XXXX-XXXX-XXXX
            </p>
          </div>
          
          <div v-if="codeError" class="text-sm text-red-600 bg-red-50 p-3 rounded">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
            {{ codeError }}
          </div>
        </div>
        
        <div class="space-y-3">
          <UButton
            label="Verbinden"
            icon="i-heroicons-link"
            size="lg"
            block
            :disabled="!inputCode.trim()"
            @click="handleCodeSubmit"
            class="font-medium"
          />
          
          <UButton
            label="Annuleren"
            variant="outline"
            @click="resetToMenu"
          />
        </div>
      </div>

      <!-- Connected Step -->
      <div v-if="currentStep === 'connected'" class="space-y-4">
        <div class="text-center mb-6">
          <UIcon name="i-heroicons-check-circle" class="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Verbonden!</h2>
          <p class="text-gray-600">
            Je apparaat is nu verbonden. Je kunt gegevens synchroniseren.
          </p>
        </div>

        <div class="space-y-3">
          <UButton
            label="Gegevens synchroniseren"
            icon="i-heroicons-arrow-path"
            size="lg"
            block
            :disabled="!canStartSync"
            @click="performSync"
            class="font-medium"
          />
          
          <UButton
            label="Synchronisatie aanvragen"
            icon="i-heroicons-arrow-down-tray"
            variant="outline"
            size="lg"
            block
            @click="requestSyncFromPeer"
            class="font-medium"
          />
        </div>

        <div class="pt-4 border-t border-gray-200">
          <UButton
            label="Verbinding verbreken"
            icon="i-heroicons-x-mark"
            color="red"
            variant="ghost"
            size="sm"
            block
            @click="handleDisconnect"
          />
        </div>
      </div>
    </div>
  </div>
</template>