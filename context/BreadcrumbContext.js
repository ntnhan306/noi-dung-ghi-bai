
import React, { createContext, useContext, useState, useCallback } from 'react';

const BreadcrumbContext = createContext();

export const BreadcrumbProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  
  const updateBreadcrumbs = useCallback((newBreadcrumbs) => {
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  return React.createElement(BreadcrumbContext.Provider, { value: { breadcrumbs, updateBreadcrumbs } }, children);
};

export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
};
