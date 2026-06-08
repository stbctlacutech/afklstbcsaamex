/**
 * build.js — Sincroniza los datos del sistema STBC
 * 
 * INSTRUCCIONES DE USO:
 * 1. Edita los archivos en la carpeta data/:
 *    - data/agentes.json       → nombres, skills, descansos base
 *    - data/posiciones.json    → posiciones, slots, reglas
 *    - data/operacion-2026-05.json → horario, incapacidades, permutas, etc.
 * 2. Abre una terminal en esta carpeta
 * 3. Corre: node build.js
 *    (opcional: node build.js --minify  → genera config.js minificado)
 * 4. El script actualizará automáticamente:
 *    - config.json
 *    - config.js
 *    - calendario_stbc.html (si aún usa bloques hardcodeados)
 * 5. Refresca el navegador para ver los cambios
 */

const fs = require('fs');
const path = require('path');

// Helper: convertir descansos string a descansoPatron
function parseDescansosString(str) {
  if (!str || typeof str !== 'string') return null;
  const diaMap = {
    'dom': 0, 'lun': 1, 'mar': 2, 'mie': 3, 'mié': 3,
    'jue': 4, 'vie': 5, 'sab': 6, 'sáb': 6
  };
  const partes = str.split('-');
  if (partes.length !== 2) return null;
  const d1 = diaMap[partes[0].toLowerCase().trim()];
  const d2 = diaMap[partes[1].toLowerCase().trim()];
  if (d1 === undefined || d2 === undefined) return null;
  return [d1, d2];
}

// ── 1. LEER ARCHIVOS FUENTE ───────────────────────────────────────

const agentesData = JSON.parse(fs.readFileSync('data/agentes.json', 'utf8'));
const posicionesData = JSON.parse(fs.readFileSync('data/posiciones.json', 'utf8'));

// Leer elegibilidad de vacaciones (si existe)
let vacacionesElegibilidad = null;
try {
  vacacionesElegibilidad = JSON.parse(fs.readFileSync('data/vacaciones_elegibilidad.json', 'utf8'));
} catch (e) {
  console.log('⚠ No se encontró data/vacaciones_elegibilidad.json (opcional)');
}

// Leer mapeo supervisor_id desde supabase-inserts.sql
let supervisoresAgentes = {};
try {
  const insertsSql = fs.readFileSync('supabase-inserts.sql', 'utf8');
  insertsSql.split('\n').forEach(line => {
    if (!line.includes('INSERT INTO agentes')) return;
    const idMatch = line.match(/VALUES\s*\(\s*'([^']+)'/);
    if (!idMatch) return;
    const agentId = idMatch[1];
    const supMatch = line.match(/,\s*'([^']+)',\s*'\$2b\$/);
    if (supMatch) {
      const supId = supMatch[1];
      if (!supervisoresAgentes[supId]) supervisoresAgentes[supId] = [];
      supervisoresAgentes[supId].push(agentId);
    }
  });
  console.log('✓ Mapeo supervisoresAgentes extraído de supabase-inserts.sql');
} catch (e) {
  console.log('⚠ No se pudo leer supabase-inserts.sql para mapeo de supervisores');
}

// Normalizar descansos: si un agente tiene descansos string pero no descansoPatron, generarlo
agentesData.agentes.forEach(a => {
  if (a.descansos && !a.descansoPatron) {
    const dias = parseDescansosString(a.descansos);
    if (dias) {
      a.descansoPatron = { diasDescanso: dias };
    }
  }
});

// Leer TODOS los archivos de operación del año y combinarlos
const operacionFiles = fs.readdirSync('data')
  .filter(f => f.match(/^operacion-2026-\d{2}\.json$/))
  .sort();

const operacionMerged = {
  incapacidades: [],
  permisoEntradaTarde: [],
  permisoSinGoce: [],
  cursosAduana: [],
  descansosAjuste: [],
  descansoLaborado: [],
  observacionPeriodos: [],
  permutas: [],
  cursosRecurrentes: [],
  onboardingSchedule: [],
  vacaciones: []
};

operacionFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join('data', file), 'utf8'));
  Object.keys(operacionMerged).forEach(key => {
    if (Array.isArray(data[key])) {
      operacionMerged[key] = operacionMerged[key].concat(data[key]);
    }
  });
});

console.log('📁 Archivos de operación leídos:', operacionFiles.join(', '));

// ── 2. GENERAR config.json ────────────────────────────────────────

// El horario ya no se incluye en config: se calcula por patrón cíclico en roster-data.js
const { horario, ...operacionSinHorario } = operacionMerged;

// Transformar vacaciones al formato que usa window.VACACIONES_APROBADAS
const vacacionesAprobadas = (operacionMerged.vacaciones || []).map(v => ({
  agente_id: v.id,
  fecha_inicio: v.fechaInicio,
  fecha_fin: v.fechaFin || v.fechaInicio
}));

const config = {
  ...posicionesData,
  ...agentesData,
  ...operacionSinHorario,
  ...(vacacionesAprobadas.length ? { vacacionesAprobadas } : {}),
  ...(vacacionesElegibilidad ? { vacacionesElegibilidad } : {}),
  ...(Object.keys(supervisoresAgentes).length ? { supervisoresAgentes } : {})
};

fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
console.log('✓ config.json generado (' + JSON.stringify(config).length + ' chars)');

// 2b. Generar config.js (versión script para carga síncrona)
const minify = process.argv.includes('--minify');
const configJs = 'window.__CONFIG = ' + JSON.stringify(config, null, minify ? undefined : 2) + ';\n';
fs.writeFileSync('config.js', configJs);
console.log('✓ config.js generado (' + (minify ? 'minificado' : 'pretty-print') + ', funciona con file://)');

// ── 3. ACTUALIZAR calendario_stbc.html ────────────────────────────

let calHtml = fs.readFileSync('calendario_stbc.html', 'utf8');

// Detectar si el calendario ya usa carga dinámica (formato nuevo)
const esCalendarioDinamico = calHtml.includes('window.__CONFIG.agentes') && calHtml.includes('window.__CONFIG.permutas');

if (esCalendarioDinamico) {
  console.log('✓ calendario_stbc.html usa carga dinámica (no requiere parcheo de bloques)');
  
  // Verificar que los scripts necesarios estén cargados
  const tieneConfigJs = calHtml.includes('src="config.js"');
  const tieneRosterData = calHtml.includes('src="roster-data.js"');
  if (tieneConfigJs && tieneRosterData) {
    console.log('✓ Scripts config.js y roster-data.js presentes en calendario');
  } else {
    console.warn('⚠ El calendario dinámico requiere <script src="config.js"> y <script src="roster-data.js">');
  }
} else {
  // MODO LEGACY: parchear bloques hardcodeados
  
  // 3a. Actualizar const agentes (transformar tipos al formato del calendario)
  const calAgentes = agentesData.agentes.map(a => ({
    id: a.id,
    nombre: a.nombre,
    tipo: a.tipo === 'supervisor' ? 'Supervisor de tráfico' : 'Agente de tráfico',
    descansos: a.descansos,
    cumple: a.cumple
  }));

  const agentesStr = 'const agentes = ' + JSON.stringify(calAgentes) + ';';
  const oldAgentes = calHtml.match(/const agentes = (\[.*?\]);/s);
  if (oldAgentes) {
    calHtml = calHtml.replace(oldAgentes[0], agentesStr);
    console.log('✓ Bloque agentes actualizado en calendario');
  } else {
    console.warn('⚠ No se encontró el bloque agentes en calendario_stbc.html');
  }

  // 3b. Reemplazar const horario por comentario (ahora se calcula por patrón)
  const horarioStr = '/* horario eliminado — se calcula por patrón cíclico en roster-data.js */';
  const oldHorario = calHtml.match(/const horario = (\{.*?\});/s);
  if (oldHorario) {
    calHtml = calHtml.replace(oldHorario[0], horarioStr);
    console.log('✓ Bloque horario eliminado del calendario (patrón cíclico activo)');
  } else {
    console.warn('⚠ No se encontró el bloque horario en calendario_stbc.html');
  }

  // 3c. Actualizar const _PERMUTAS
  const permutasStr = 'const _PERMUTAS = ' + JSON.stringify(operacionData.permutas || [], null, 2).replace(/\n/g, '\n    ') + ';';
  const oldPermutas = calHtml.match(/const _PERMUTAS = (\[[\s\S]*?\]);/);
  if (oldPermutas) {
    calHtml = calHtml.replace(oldPermutas[0], permutasStr);
    console.log('✓ Bloque _PERMUTAS actualizado en calendario');
  } else {
    console.warn('⚠ No se encontró el bloque _PERMUTAS en calendario_stbc.html');
  }

  fs.writeFileSync('calendario_stbc.html', calHtml);
  console.log('✓ calendario_stbc.html guardado');
}

// ── 4. RESUMEN ────────────────────────────────────────────────────

console.log('\n📋 RESUMEN DE DATOS:');
console.log('  Agentes:', agentesData.agentes.length);
console.log('  Excluidos WFM:', agentesData.wfmExcludedIds?.length || 0);
console.log('  Posiciones (Normal):', posicionesData.positionsNormal?.length || 0);
console.log('  Posiciones (Verano):', posicionesData.positionsVeranoMex?.length || 0);
console.log('  Incapacidades:', operacionMerged.incapacidades?.length || 0);
console.log('  Permutas:', operacionMerged.permutas?.length || 0);
console.log('  Permisos:', operacionMerged.permisoEntradaTarde?.length || 0);
console.log('  Cursos Aduana:', operacionMerged.cursosAduana?.length || 0);
console.log('  Cursos Recurrentes:', operacionMerged.cursosRecurrentes?.length || 0);
console.log('\n🎉 Listo. Recarga el navegador para ver los cambios.');
