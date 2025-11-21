import React from 'react';
import htm from 'htm';

// Bind htm to React.createElement explicitly.
// Ensure React is available before binding.
const createElement = React.createElement || (React.default && React.default.createElement);

if (!createElement) {
    console.error("React.createElement is undefined. Check import maps.");
}

export const html = htm.bind(createElement);