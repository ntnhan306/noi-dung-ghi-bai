
import React, { createContext, useContext, useState, useCallback } from 'react';
import { html } from '../utils/html.js';

const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  const updateBreadcrumbs = useCallback((newBreadcrumbs) => {
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  return html`
    <${BreadcrumbContext.Provider} value=${{ breadcrumbs, updateBreadcrumbs }}>
      ${children}
    </${BreadcrumbContext.Provider}>
  `;
};

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
};
