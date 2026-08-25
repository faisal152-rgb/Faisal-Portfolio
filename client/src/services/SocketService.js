import { apiService } from './apiService';
import { dataService } from './DataService';

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      import('socket.io-client').then(({ io }) => {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || (
          import.meta.env.PROD
            ? 'https://faisal-portfolio-csv3.onrender.com'
            : `${window.location.protocol}//${window.location.hostname}:5000`
        );

        this.socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          timeout: 20000, // 20 seconds
        });

        this.socket.on('connect', () => {
          this.reconnectAttempts = 0;
          
          // Join admin room if authenticated
          if (token) {
            this.socket.emit('join-admin');
          } else {
            this.socket.emit('join-public');
          }
          
          // Initialize data service listeners
          dataService.initializeSocketListeners(this.socket);
          
          resolve(this.socket);
        });

        this.socket.on('disconnect', (reason) => {
          this.notify('disconnect', { reason });
        });

        this.socket.on('connect_error', (error) => {
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Max reconnection attempts reached'));
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          this.reconnectAttempts = 0;
          this.notify('reconnect', { attemptNumber });
        });

        // Forward all events to listeners
        this.socket.onAny((event, ...args) => {
          this.notify(event, args[0]);
        });
      }).catch((error) => {
        reject(new Error('Socket.io client not available'));
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => this.off(event, callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  notify(event, data) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
      }
    });
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
