
import React, { createContext, useContext, useState, useEffect } from 'react';
import { html } from '../utils/html.js';
import { apiService } from '../services/apiService.js';

const ClassContext = createContext();

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    setLoading(true);
    const config = await apiService.getFullConfig();
    const classList = config.classes || [];
    setClasses(classList);
    
    // Set default class if none selected
    if (classList.length > 0) {
      const defaultClass = classList.find(c => c.isDefault);
      if (defaultClass) {
        setSelectedClassId(defaultClass.id);
      } else if (classList.length === 1) {
        setSelectedClassId(classList[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const updateClasses = async (newClasses) => {
    setClasses(newClasses);
    const config = await apiService.getFullConfig();
    config.classes = newClasses;
    await apiService.saveFullConfig(config);
  };

  return html`
    <${ClassContext.Provider} value=${{ classes, selectedClassId, setSelectedClassId, updateClasses, fetchClasses, loading }}>
      ${children}
    </${ClassContext.Provider}>
  `;
};

export const useClasses = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClasses must be used within a ClassProvider');
  }
  return context;
};
