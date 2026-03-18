
import React, { createContext, useContext, useState, useCallback } from 'react';
import { html } from '../utils/html.js';

const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  
  const updateBreadcrumbs = useCallback((newBreadcrumbs) => {
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  const setBreadcrumbsVisible = useCallback((visible) => {
    setIsVisible(visible);
  }, []);

  return html`
    <${BreadcrumbContext.Provider} value=${{ breadcrumbs, updateBreadcrumbs, isVisible, setBreadcrumbsVisible }}>
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
