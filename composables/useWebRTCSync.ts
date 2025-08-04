import { ref, computed, onBeforeUnmount } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { BabyProfile, MilkEntry } from './useBaby';

export interface SyncData {
  babyProfile: BabyProfile | null;
  milkEntries: MilkEntry[];
  lastSync: Date;
  deviceId: string;
}

export interface ConnectionOffer {
  deviceId: string;
  timestamp: number;
  offer: RTCSessionDescriptionInit;
}

export interface ConnectionAnswer {
  deviceId: string;
  timestamp: number;
  answer: RTCSessionDescriptionInit;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

export function useWebRTCSync() {
  // Reactive state
  const connectionState = ref<ConnectionState>('disconnected');
  const isHost = ref(false);
  const deviceId = ref(localStorage.getItem('webrtc-device-id') || uuidv4());
  const connectedDeviceId = ref<string | null>(null);
  const lastSyncTime = ref<Date | null>(null);
  const syncInProgress = ref(false);
  
  // WebRTC components
  let peerConnection: RTCPeerConnection | null = null;
  let dataChannel: RTCDataChannel | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  
  // Configuration for WebRTC
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Save device ID to localStorage
  if (!localStorage.getItem('webrtc-device-id')) {
    localStorage.setItem('webrtc-device-id', deviceId.value);
  }

  // Computed properties
  const isConnected = computed(() => connectionState.value === 'connected');
  const canSync = computed(() => isConnected.value && !syncInProgress.value);

  // Initialize peer connection
  const initializePeerConnection = () => {
    if (peerConnection) {
      peerConnection.close();
    }

    peerConnection = new RTCPeerConnection(rtcConfiguration);
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection?.connectionState;
      console.log('[WebRTC] Connection state:', state);
      
      switch (state) {
        case 'connected':
          connectionState.value = 'connected';
          clearReconnectTimeout();
          break;
        case 'disconnected':
        case 'failed':
          connectionState.value = 'failed';
          scheduleReconnect();
          break;
        case 'connecting':
          connectionState.value = 'connecting';
          break;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated');
        // In a real implementation, you'd send this to the other peer
        // For now, we'll handle this in the connection process
      }
    };

    // Handle incoming data channel (for non-host)
    peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      setupDataChannel(channel);
    };
  };

  // Setup data channel
  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannel = channel;
    
    channel.onopen = () => {
      console.log('[WebRTC] Data channel opened');
      connectionState.value = 'connected';
    };
    
    channel.onclose = () => {
      console.log('[WebRTC] Data channel closed');
      connectionState.value = 'disconnected';
    };
    
    channel.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error);
      connectionState.value = 'failed';
    };
    
    channel.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await handleSyncMessage(message);
      } catch (error) {
        console.error('[WebRTC] Error handling message:', error);
      }
    };
  };

  // Create connection offer (host side)
  const createOffer = async (): Promise<ConnectionOffer> => {
    initializePeerConnection();
    
    if (!peerConnection) {
      throw new Error('Failed to initialize peer connection');
    }

    // Create data channel (host creates the channel)
    const channel = peerConnection.createDataChannel('sync', {
      ordered: true,
    });
    setupDataChannel(channel);
    
    isHost.value = true;
    connectionState.value = 'connecting';
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    return {
      deviceId: deviceId.value,
      timestamp: Date.now(),
      offer,
    };
  };

  // Create connection answer (client side)
  const createAnswer = async (connectionOffer: ConnectionOffer): Promise<ConnectionAnswer> => {
    initializePeerConnection();
    
    if (!peerConnection) {
      throw new Error('Failed to initialize peer connection');
    }

    isHost.value = false;
    connectionState.value = 'connecting';
    connectedDeviceId.value = connectionOffer.deviceId;
    
    await peerConnection.setRemoteDescription(connectionOffer.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    return {
      deviceId: deviceId.value,
      timestamp: Date.now(),
      answer,
    };
  };

  // Complete connection (host side)
  const completeConnection = async (connectionAnswer: ConnectionAnswer) => {
    if (!peerConnection) {
      throw new Error('No peer connection available');
    }

    connectedDeviceId.value = connectionAnswer.deviceId;
    await peerConnection.setRemoteDescription(connectionAnswer.answer);
  };

  // Send sync data
  const sendSyncData = async (data: SyncData) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const message = {
      type: 'sync_data',
      data,
      timestamp: Date.now(),
    };

    dataChannel.send(JSON.stringify(message));
  };

  // Handle incoming sync messages
  const handleSyncMessage = async (message: any) => {
    switch (message.type) {
      case 'sync_data':
        await handleSyncData(message.data);
        break;
      case 'sync_request':
        await handleSyncRequest();
        break;
      case 'ping':
        sendPong();
        break;
      case 'pong':
        // Connection is alive
        break;
      default:
        console.warn('[WebRTC] Unknown message type:', message.type);
    }
  };

  // Handle incoming sync data
  const handleSyncData = async (incomingData: SyncData) => {
    syncInProgress.value = true;
    
    try {
      // This will be implemented when we extend the baby composable
      console.log('[WebRTC] Received sync data:', incomingData);
      lastSyncTime.value = new Date();
      
      // Trigger a custom event that the baby composable can listen to
      window.dispatchEvent(new CustomEvent('webrtc-sync-data', {
        detail: incomingData
      }));
    } finally {
      syncInProgress.value = false;
    }
  };

  // Handle sync request
  const handleSyncRequest = async () => {
    // This will be implemented when we extend the baby composable
    window.dispatchEvent(new CustomEvent('webrtc-sync-request'));
  };

  // Request sync from connected peer
  const requestSync = async () => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const message = {
      type: 'sync_request',
      timestamp: Date.now(),
    };

    dataChannel.send(JSON.stringify(message));
  };

  // Send ping to keep connection alive
  const sendPing = () => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
      }));
    }
  };

  // Send pong response
  const sendPong = () => {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
      }));
    }
  };

  // Schedule reconnection attempt
  const scheduleReconnect = () => {
    clearReconnectTimeout();
    reconnectTimeout = setTimeout(() => {
      if (connectionState.value === 'failed') {
        console.log('[WebRTC] Attempting to reconnect...');
        // In a real implementation, you'd need to store connection info
        // and attempt to re-establish the connection
      }
    }, 5000);
  };

  // Clear reconnect timeout
  const clearReconnectTimeout = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  // Disconnect
  const disconnect = () => {
    clearReconnectTimeout();
    
    if (dataChannel) {
      dataChannel.close();
      dataChannel = null;
    }
    
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    connectionState.value = 'disconnected';
    connectedDeviceId.value = null;
    isHost.value = false;
  };

  // Start periodic ping to keep connection alive
  let pingInterval: NodeJS.Timeout;
  const startHeartbeat = () => {
    pingInterval = setInterval(() => {
      if (isConnected.value) {
        sendPing();
      }
    }, 30000); // Ping every 30 seconds
  };

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }
  };

  // Start heartbeat when connected
  watch(isConnected, (connected) => {
    if (connected) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  });

  // Cleanup on unmount
  onBeforeUnmount(() => {
    disconnect();
    stopHeartbeat();
  });

  return {
    // State
    connectionState: readonly(connectionState),
    isConnected,
    canSync,
    isHost: readonly(isHost),
    deviceId: readonly(deviceId),
    connectedDeviceId: readonly(connectedDeviceId),
    lastSyncTime: readonly(lastSyncTime),
    syncInProgress: readonly(syncInProgress),
    
    // Actions
    createOffer,
    createAnswer,
    completeConnection,
    sendSyncData,
    requestSync,
    disconnect,
  };
}