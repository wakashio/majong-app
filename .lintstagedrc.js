const path = require('path');

module.exports = {
  'backend/**/*.{ts,js}': (filenames) => {
    const backendFiles = filenames
      .filter((file) => file.startsWith('backend/'))
      .map((file) => path.relative('backend', file));
    
    if (backendFiles.length === 0) {
      return [];
    }
    
    return [
      `npm run lint:fix --prefix backend -- ${backendFiles.map((f) => `"${f}"`).join(' ')}`,
    ];
  },
  'frontend/**/*.{ts,js,vue}': (filenames) => {
    const frontendFiles = filenames
      .filter((file) => file.startsWith('frontend/'))
      .map((file) => path.relative('frontend', file));
    
    if (frontendFiles.length === 0) {
      return [];
    }
    
    return [
      `npm run lint --prefix frontend -- ${frontendFiles.map((f) => `"${f}"`).join(' ')}`,
    ];
  },
};

