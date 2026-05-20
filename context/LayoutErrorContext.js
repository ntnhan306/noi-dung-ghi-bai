import React, { createContext, useContext, useState } from 'react';
import { html } from '../utils/html.js';

const LayoutErrorContext = createContext();

export const LayoutErrorProvider = ({ children }) => {
  const [layoutError, setLayoutError] = useState(null);

  return html`
    <${LayoutErrorContext.Provider} value=${{ layoutError, setLayoutError }}>
      ${children}
    </${LayoutErrorContext.Provider}>
  `;
};

export const useLayoutError = () => {
  const context = useContext(LayoutErrorContext);
  return context || { layoutError: null, setLayoutError: () => {} };
};
