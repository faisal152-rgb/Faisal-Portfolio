import { createContext, useContext } from 'react';

const SecurityContext = createContext({
  token: null,
  user: null,
});

export const useSecurity = () => useContext(SecurityContext);

export default SecurityContext;
