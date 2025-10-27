// Ejecuta esto en la consola del navegador (F12) para limpiar datos locales

// Limpiar localStorage
localStorage.removeItem('attendancePolls');
localStorage.clear();

// Limpiar IndexedDB
if ('indexedDB' in window) {
  indexedDB.deleteDatabase('TrainingAppDB');
}

// Recargar la página
window.location.reload();

console.log('Datos locales limpiados. Recarga la página.');