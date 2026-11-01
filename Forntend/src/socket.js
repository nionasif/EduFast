import { io } from 'socket.io-client';
import { getToken, getCustomServerUrl } from './services/api';

export const SOCKET_URL = getCustomServerUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  auth: (cb) => {
    const token = getToken();
    cb({ token: token || '' });
  }
});

// Update socket auth token dynamically upon login/switch
export const refreshSocketAuth = (token) => {
  const currentToken = token || getToken();
  socket.auth = { token: currentToken || '' };
  if (socket.connected) {
    socket.disconnect().connect();
  }
};

export default socket;
