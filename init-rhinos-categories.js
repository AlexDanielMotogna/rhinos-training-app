/**
 * Inicialización rápida de categorías para USR Rhinos
 * Ejecutar ANTES de registrar usuarios
 */

// Función para inicializar categorías directamente en TeamSettings
async function initRhinosCategories() {
  try {
    console.log('🏈 Inicializando categorías de USR Rhinos...');

    // Categorías específicas de los Rhinos
    const rhinosCategories = ['Kampfmannschaft', 'Jugend'];

    // Actualizar en localStorage (para desarrollo/testing)
    const STORAGE_KEY = 'rhinos_team_settings';
    const currentSettings = localStorage.getItem(STORAGE_KEY);

    if (currentSettings) {
      const settings = JSON.parse(currentSettings);
      settings.allowedCategories = rhinosCategories;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('✅ Categorías actualizadas en localStorage');
    } else {
      // Crear settings por defecto con las categorías
      const defaultSettings = {
        seasonPhase: 'off-season',
        teamLevel: 'amateur',
        teamCategory: 'principal',
        allowedCategories: rhinosCategories,
        branding: {
          appName: 'Rhinos Training',
          logoUrl: '/USR_Allgemein_Quard_Transparent.png',
          primaryColor: '#203731',
          secondaryColor: '#FFB612',
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      console.log('✅ Settings creados con categorías');
    }

    console.log('✅ Categorías configuradas:', rhinosCategories);
    console.log('📝 Recarga la página para ver el campo de categoría en Sign Up');

    return rhinosCategories;
  } catch (error) {
    console.error('❌ Error al inicializar categorías:', error);
    throw error;
  }
}

// Si estás en el navegador, ejecutar automáticamente
if (typeof window !== 'undefined') {
  console.log('🏈 Script de inicialización de categorías Rhinos cargado');
  console.log('📌 Para ejecutar, escribe en la consola:');
  console.log('   initRhinosCategories()');

  // Hacer la función disponible globalmente
  window.initRhinosCategories = initRhinosCategories;
}

// Para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initRhinosCategories };
}
