import { createContext, useContext } from 'react';

const SystemStatusContext = createContext({
  status: null,
  isOperational: true,
  statusText: 'Available for Opportunities',
  statusLabel: 'Available',
  loading: true,
  error: null,
  refreshStatus: async () => undefined,
});

export const useSystemStatus = () => useContext(SystemStatusContext);

export default SystemStatusContext;
