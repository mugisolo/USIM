import { Incident } from '../types';

/**
 * Service to handle real-time data ingestion via WebSockets.
 * 
 * This service connects to the U-ISMS Intelligence Stream to receive live incident reports.
 * It does NOT simulate data; it requires an active backend connection.
 * 
 * Connection URL is determined by process.env.REACT_APP_WS_URL or defaults to production stream.
 */
class LiveDataService {
  private socket: WebSocket | null = null;
  private callbacks: Set<(_incident: Incident) => void> = new Set();
  private reconnectInterval: number = 5000;
  private reconnectTimer: any = null;
  private url: string = 'wss://stream.u-isms.gov.ug/v1/incidents'; 

  constructor() {
     // Allow environment variable override for local dev or specific feeds
     // Safely check for process to avoid reference errors in some build environments
     if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_WS_URL) {
         this.url = process.env.REACT_APP_WS_URL;
     }
  }

  /**
   * Connect to the stream and register a callback for new incidents.
   */
  public connect(callback: (_incident: Incident) => void) {
    this.callbacks.add(callback);
    
    // If already connected, do nothing
    if (this.socket?.readyState === WebSocket.OPEN) {
        return;
    }
    
    // If currently connecting, do nothing
    if (this.socket?.readyState === WebSocket.CONNECTING) {
        return;
    }

    this.initSocket();
  }

  /**
   * Unregister a callback. If no listeners remain, close the socket to save resources.
   */
  public disconnect(callback: (_incident: Incident) => void) {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0 && this.socket) {
          console.log('U-ISMS Stream: No listeners remaining, closing connection.');
          this.socket.close();
          this.socket = null;
      }
  }

  private initSocket() {
      try {
          console.log(`U-ISMS Intelligence Stream: Connecting to ${this.url}...`);
          this.socket = new WebSocket(this.url);

          this.socket.onopen = () => {
              console.log('U-ISMS Intelligence Stream: Connected via Secure WebSocket');
              if (this.reconnectTimer) {
                  clearTimeout(this.reconnectTimer);
                  this.reconnectTimer = null;
              }
          };

          this.socket.onmessage = (event) => {
              try {
                  const payload = JSON.parse(event.data);
                  
                  // Validate payload structure matches Incident interface
                  if (payload && payload.id && payload.type && payload.location) {
                      const incident = payload as Incident;
                      this.callbacks.forEach(cb => cb(incident));
                  } else {
                      console.debug('Received non-incident packet:', payload);
                  }
              } catch (e) {
                  console.error('Failed to parse incident stream packet:', e);
              }
          };

          this.socket.onerror = (error) => {
              // Note: WebSocket errors are often silent in JS for security, check network tab
              console.warn('Stream connection error. Ensure backend is reachable.', error);
          };

          this.socket.onclose = (e) => {
              console.log(`U-ISMS Stream: Disconnected (Code: ${e.code})`);
              // Only attempt reconnect if we still have interested listeners
              if (this.callbacks.size > 0) {
                  this.scheduleReconnect();
              }
          };

      } catch (e) {
          console.error('Socket initialization failed:', e);
          this.scheduleReconnect();
      }
  }

  private scheduleReconnect() {
      if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
              console.log('Attempting stream reconnection...');
              this.reconnectTimer = null;
              this.initSocket();
          }, this.reconnectInterval);
      }
  }
}

export const liveDataService = new LiveDataService();