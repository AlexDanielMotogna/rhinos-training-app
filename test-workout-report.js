/**
 * MOCK DATA PARA PROBAR EL WORKOUT REPORT
 *
 * Copia este código en la consola del navegador mientras estás logueado
 * en la app para probar el sistema de reportes manualmente.
 */

// 1. IMPORT DE FUNCIONES (ya están cargadas en la app)
// import { analyzeWorkout } from './services/workoutAnalysis';
// import { saveWorkoutReport } from './services/workoutReports';

// 2. MOCK DATA - Workout de ejemplo (Compound Lifts)
const mockWorkoutEntries = [
  {
    exerciseId: 'ex-001',
    name: 'Bench Press',
    category: 'Strength',
    sets: 3,
    setData: [
      { setNumber: 1, reps: 10, kg: 50 },
      { setNumber: 2, reps: 8, kg: 55 },
      { setNumber: 3, reps: 6, kg: 60 }
    ],
    rpe: 8,
    source: 'coach',
    specific: false,
    notes: 'Felt strong today'
  },
  {
    exerciseId: 'ex-062',
    name: 'Trap Bar Deadlift',
    category: 'Strength',
    sets: 3,
    setData: [
      { setNumber: 1, reps: 8, kg: 80 },
      { setNumber: 2, reps: 8, kg: 85 },
      { setNumber: 3, reps: 6, kg: 90 }
    ],
    rpe: 9,
    source: 'coach',
    specific: false
  },
  {
    exerciseId: 'ex-003',
    name: 'Overhead Press',
    category: 'Strength',
    sets: 3,
    setData: [
      { setNumber: 1, reps: 10, kg: 30 },
      { setNumber: 2, reps: 8, kg: 32.5 },
      { setNumber: 3, reps: 8, kg: 32.5 }
    ],
    rpe: 7,
    source: 'coach',
    specific: false
  },
  {
    exerciseId: 'ex-004',
    name: 'Barbell Row',
    category: 'Strength',
    sets: 3,
    setData: [
      { setNumber: 1, reps: 10, kg: 50 },
      { setNumber: 2, reps: 10, kg: 50 },
      { setNumber: 3, reps: 8, kg: 55 }
    ],
    rpe: 7,
    source: 'coach',
    specific: false
  }
];

// 3. DATOS DEL USUARIO (obtener del usuario logueado)
const mockUserId = 'user-1'; // Reemplazar con user real
const mockUserPosition = 'RB'; // Running Back
const mockDuration = 45; // minutos

// 4. FUNCIÓN PARA PROBAR EN LA CONSOLA DEL NAVEGADOR
function testWorkoutReport() {
  console.log('🏋️ Iniciando test de Workout Report...\n');

  // Calcular volumen manualmente para verificar
  let totalVolume = 0;
  mockWorkoutEntries.forEach(entry => {
    entry.setData.forEach(set => {
      totalVolume += set.reps * set.kg;
    });
  });
  console.log('📊 Volumen calculado manualmente:', totalVolume, 'kg');

  // Llamar a analyzeWorkout (asume que está disponible en window)
  const report = window.analyzeWorkout?.(
    mockWorkoutEntries,
    mockDuration,
    mockUserId,
    mockUserPosition
  );

  if (!report) {
    console.error('❌ Error: analyzeWorkout no está disponible');
    console.log('Asegúrate de estar en la página de la app');
    return;
  }

  console.log('\n✅ REPORTE GENERADO:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 PERFORMANCE SCORES:');
  console.log('  • Intensity Score:', report.intensityScore, '/100');
  console.log('  • Work Capacity Score:', report.workCapacityScore, '/100');
  console.log('  • Athletic Quality Score:', report.athleticQualityScore, '/100');
  console.log('  • Position Relevance Score:', report.positionRelevanceScore, '/100');

  console.log('\n📈 WORKOUT BREAKDOWN:');
  console.log('  • Total Volume:', report.totalVolume, 'kg');
  console.log('  • Duration:', report.duration, 'min');
  console.log('  • Average RPE:', report.avgRPE, '/10');
  console.log('  • Sets Completed:', report.setsCompleted, '/', report.setsPlanned);

  console.log('\n💪 ATHLETIC FOCUS:');
  console.log('  • Power Work:', report.powerWork, '%');
  console.log('  • Strength Work:', report.strengthWork, '%');
  console.log('  • Speed Work:', report.speedWork, '%');

  console.log('\n✨ HIGHLIGHTS:');
  console.log('  Strengths:');
  report.strengths.forEach(s => console.log('    ✓', s));
  console.log('  Warnings:');
  report.warnings.forEach(w => console.log('    ⚠️', w));

  console.log('\n🔄 PROGRESS:');
  console.log('  • Volume Change:', report.volumeChange || 'N/A');
  console.log('  • Intensity Change:', report.intensityChange || 'N/A');

  console.log('\n😴 RECOVERY:');
  console.log('  • Demand:', report.recoveryDemand);
  console.log('  • Recommended Rest:', report.recommendedRestHours, 'hours');

  console.log('\n🤖 COACH INSIGHTS:');
  console.log('  ', report.coachInsights);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return report;
}

// 5. FUNCIÓN PARA GUARDAR EL REPORTE
function saveTestReport(report) {
  if (!report) {
    console.error('❌ Primero ejecuta testWorkoutReport()');
    return;
  }

  const user = window.getUser?.();
  if (!user) {
    console.error('❌ No hay usuario logueado');
    return;
  }

  const saved = window.saveWorkoutReport?.(
    user.id,
    'Test Workout - Compound Lifts',
    report,
    'coach'
  );

  if (saved) {
    console.log('✅ Reporte guardado exitosamente!');
    console.log('Ve a My Training → Team Sessions → My Reports para verlo');
  } else {
    console.error('❌ Error al guardar el reporte');
  }

  return saved;
}

// 6. INSTRUCCIONES
console.log(`
╔════════════════════════════════════════════════════════════╗
║          TEST DE WORKOUT REPORT - INSTRUCCIONES           ║
╚════════════════════════════════════════════════════════════╝

📝 PASOS PARA PROBAR:

1. Abre la app en el navegador y logueate
2. Abre la consola del navegador (F12)
3. Copia TODO este archivo y pégalo en la consola
4. Ejecuta:

   const report = testWorkoutReport();

5. Si quieres guardarlo:

   saveTestReport(report);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 MOCK WORKOUT INCLUIDO:
   • 4 ejercicios (Bench, Deadlift, OHP, Row)
   • 12 sets totales
   • ~2,485 kg de volumen
   • 45 minutos de duración
   • RPE promedio: 7.75

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testWorkoutReport, saveTestReport, mockWorkoutEntries };
}
