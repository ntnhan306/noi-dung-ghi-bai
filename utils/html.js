import React from 'react';
import htm from 'htm';

// Bind htm to React.createElement explicitly.
// This avoids issues where 'htm/react' module tries to import named exports 
// that might not exist in certain React ESM builds.
export const html = htm.bind(React.createElement);
