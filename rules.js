(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // DATOS POR DEFECTO (fallback si falla fetch de config.json)
  // ═══════════════════════════════════════════════════════════════════
  const FALLBACK_POSITIONS_NORMAL = [
    { id: 'recibe',             name: 'Migracion/Recepcion de vuelos',      time: '17:25-21:15', minAgents: 1, skills: ['A0'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'loby_prep_mostradores', name: 'Loby/Preparar Mostradores',       time: '14:35-15:00', minAgents: 1, skills: [],     critical: false, pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_econ',     name: 'Mostrador Economy',                  time: '15:00-23:30', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_drop1',    name: 'Drop-Off 1',                         time: '15:00-23:30', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_drop2',    name: 'Drop-Off 2',                         time: '15:00-21:00', minAgents: 1, skills: ['A3'], critical: false, pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_prio1',    name: 'Priority 1',                         time: '15:00-23:30', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_prio2',    name: 'Priority 2',                         time: '15:00-21:00', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_prio3',    name: 'Priority 3',                         time: '15:00-21:00', minAgents: 1, skills: ['A3'], critical: false, pool: 'traffic',    requiresBag: false },
    { id: 'quiosco',            name: 'Apoyo Quioscos',                     time: '16:00-20:00', minAgents: 2, skills: ['A3'], critical: false, pool: 'traffic',    requiresBag: false, maxAgents: 5 },
    { id: 'embarque_af179',     name: 'Abordaje AF179',                     time: '18:25-19:15', minAgents: 5, skills: ['A2'], critical: true,  pool: 'traffic',    requiresBag: true  },
    { id: 'embarque_kl686',     name: 'Abordaje KL686',                     time: '19:30-20:05', minAgents: 5, skills: ['A2'], critical: true,  pool: 'traffic',    requiresBag: true  },
    { id: 'embarque_af173',     name: 'Abordaje AF173',                     time: '21:15-22:05', minAgents: 5, skills: ['A2'], critical: true,  pool: 'traffic',    requiresBag: true  },
    { id: 'equipaje_general',   name: 'Aduana/Equipaje (Todos Vuelos)',     time: '17:45-21:45', minAgents: 2, skills: ['A5'], critical: true,  pool: 'traffic',    requiresBag: false, shared: true, area: 'aduana' },
    { id: 'supervisor_control', name: 'Supervisor Control',                 time: '15:00-23:30', minAgents: 1, skills: ['C4'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_caja',    name: 'Supervisor Caja',                    time: '15:00-23:30', minAgents: 1, skills: ['C1'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_gate',    name: 'Supervisor Gate',                    time: '15:00-23:30', minAgents: 1, skills: ['C0'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_s',       name: 'Supervisor S',                       time: '15:00-23:30', minAgents: 1, skills: ['C3'], critical: false, pool: 'supervisor', multiAssign: true },
  ];

  const FALLBACK_POSITIONS_VERANO_MEX = [
    { id: 'recibe',             name: 'Migracion/Recepcion de vuelos',      time: '16:55-20:10', minAgents: 1, skills: ['A0'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'loby_prep_mostradores', name: 'Loby/Preparar Mostradores',       time: '15:05-15:30', minAgents: 1, skills: [],     critical: false, pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_econ',     name: 'Mostrador Economy',                  time: '15:30-23:00', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_drop1',    name: 'Drop-Off 1',                         time: '15:30-23:00', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_drop2',    name: 'Drop-Off 2',                         time: '15:30-20:00', minAgents: 1, skills: ['A3'], critical: false, pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_prio1',    name: 'Priority 1',                         time: '15:30-23:00', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_prio2',    name: 'Priority 2',                         time: '15:30-20:00', minAgents: 1, skills: ['A3'], critical: true,  pool: 'traffic',    requiresBag: false },
    { id: 'mostrador_prio3',    name: 'Priority 3',                         time: '15:30-20:00', minAgents: 1, skills: ['A3'], critical: false, pool: 'traffic',    requiresBag: false },
    { id: 'quiosco',            name: 'Apoyo Quioscos',                     time: '15:30-19:30', minAgents: 2, skills: ['A3'], critical: false, pool: 'traffic',    requiresBag: false, maxAgents: 5 },
    { id: 'embarque_af179',     name: 'Abordaje AF179',                     time: '18:25-19:15', minAgents: 5, skills: ['A2'], critical: true,  pool: 'traffic',    requiresBag: true  },
    { id: 'embarque_kl686',     name: 'Abordaje KL686',                     time: '19:30-20:05', minAgents: 5, skills: ['A2'], critical: true,  pool: 'traffic',    requiresBag: true  },
    { id: 'embarque_af173',     name: 'Abordaje AF173',                     time: '21:15-22:05', minAgents: 5, skills: ['A2'], critical: true,  pool: 'traffic',    requiresBag: true  },
    { id: 'equipaje_general',   name: 'Aduana/Equipaje (Todos Vuelos)',     time: '17:15-20:30', minAgents: 2, skills: ['A5'], critical: true,  pool: 'traffic',    requiresBag: false, shared: true, area: 'aduana' },
    { id: 'supervisor_control', name: 'Supervisor Control',                 time: '15:55-23:00', minAgents: 1, skills: ['C4'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_caja',    name: 'Supervisor Caja',                    time: '15:55-23:00', minAgents: 1, skills: ['C1'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_gate',    name: 'Supervisor Gate',                    time: '16:40-23:00', minAgents: 1, skills: ['C0'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_s',       name: 'Supervisor S',                       time: '15:55-23:00', minAgents: 1, skills: ['C3'], critical: false, pool: 'supervisor', multiAssign: true },
  ];

  const FALLBACK_BREAK_SLOTS_NORMAL = [
    { time: '15:54-16:54', start: 54,  max: 6, blocked: false },
    { time: '16:37-17:37', start: 97,  max: 6, blocked: false },
    { time: '16:56-17:56', start: 116, max: 6, blocked: false },
    { time: '17:53-18:53', start: 173, max: 5, blocked: false },
    { time: '18:23-19:23', start: 203, max: 5, blocked: false },
    { time: '18:57-19:57', start: 237, max: 5, blocked: false },
    { time: '19:53-20:53', start: 293, max: 5, blocked: false },
  ];

  const FALLBACK_BLOCKED_BREAK_WINDOWS = [
    { start: 205, end: 255, reason: 'Abordaje AF179' },
    { start: 270, end: 305, reason: 'Abordaje KL686' },
    { start: 375, end: 425, reason: 'Abordaje AF173' },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // SCHEDULE — hardcodeado (requiere objeto Date)
  // ═══════════════════════════════════════════════════════════════════
  const SCHEDULE = {
    VERANO_MEX_START: new Date(2026, 2, 29),
    NORMAL: {
      name: 'Normal',
      start: '15:00',
      end: '23:30',
      startMin: 0,
      endMin: 510,
    },
    VERANO_MEX: {
      name: 'Verano MEX',
      start: '14:30',
      end: '23:00',
      startMin: -30,
      endMin: 480,
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════════
  const MAX_REPS_TRAFFIC    = 2;
  const MAX_REPS_SUPERVISOR = 2;
  const MAX_REPS_RECIBE     = 1;
  const MIN_BOARDING_ROLE_SKILL = 0.75;
  const MAX_EMBARQUES_PER_AGENT = 2;
  const MAX_COBERTURAS_TRAFFIC = 2;

  const STORAGE = {
    ASSIGNMENTS:    'wfm_assignments',
    BREAKS:         'wfm_breaks',
    COBERTURAS:     'wfm_coberturas',
    HISTORY:        'wfm_agent_history',
    BOARDING_ROLES: 'wfm_boarding_roles',
    SOMBRAS:        'wfm_sombras',
    THEME:          'stbc-theme',
  };

  const RESTRICTIONS = {
    AGENT_NOT_ASSIGNABLE: { code: 'AGENT_NOT_ASSIGNABLE', msg: 'Agente no disponible este d\u00eda' },
    AGENT_HAS_BREAK: { code: 'AGENT_HAS_BREAK', msg: 'Agente tiene descanso asignado' },
    SKILLS_INSUFFICIENT: { code: 'SKILLS_INSUFFICIENT', msg: 'Agente no tiene los skills requeridos' },
    RECIBE_EMBARQUE_EXCLUSION: { code: 'RECIBE_EMBARQUE_EXCLUSION', msg: 'Regla: Recibe \u2194 Embarque son excluyentes' },
    EMBARQUE_LIMIT: { code: 'EMBARQUE_LIMIT', msg: 'M\u00e1ximo 2 embarques por agente' },
    COURSE_SHIFT_END: { code: 'COURSE_SHIFT_END', msg: 'Regla: Agente excede su hora de salida (curso/22:00)' },
    SHIFT_END: { code: 'SHIFT_END', msg: 'Regla: La posici\u00f3n excede la hora de salida del agente' },
    OBSERVACION_RESTRICTED: { code: 'OBSERVACION_RESTRICTED', msg: 'Regla: Observaci\u00f3n solo mostradores economy/priority' },
    TIME_CONFLICT: { code: 'TIME_CONFLICT', msg: 'Conflicto de horario con posici\u00f3n actual' },
    SEQUENCE_LIMIT: { code: 'SEQUENCE_LIMIT', msg: 'Regla: m\u00e1ximo 2 d\u00edas consecutivos en el mismo tipo de asignaci\u00f3n' },
    QUIOSCO_NO_CONSECUTIVE: { code: 'QUIOSCO_NO_CONSECUTIVE', msg: 'Regla: no se permite asignaci\u00f3n consecutiva a Quiosco' },
    ADUANA_ISOLATED: { code: 'ADUANA_ISOLATED', msg: 'Regla: Aduanas es independiente (no se comparte con ninguna otra asignaci\u00f3n)' },
    KLM_DEDICATED: { code: 'KLM_DEDICATED', msg: 'Regla: KLM requiere agentes dedicados (sin otras asignaciones)' },
    BOARDING_TO_COUNTER_FORBIDDEN: { code: 'BOARDING_TO_COUNTER_FORBIDDEN', msg: 'Regla: no se permite movimiento de Abordaje a Mostrador' },
    CRITICAL_SHARING_FORBIDDEN: { code: 'CRITICAL_SHARING_FORBIDDEN', msg: 'Regla: no se permite compartir agentes entre asignaciones cr\u00edticas' },
    LOBY_ONLY_FORBIDDEN: { code: 'LOBY_ONLY_FORBIDDEN', msg: 'Regla: Loby/Preparar Mostradores no puede ser la \u00fanica funci\u00f3n del agente' },
    DIEGO_ASSIGNMENT_BLOCKED: { code: 'DIEGO_ASSIGNMENT_BLOCKED', msg: 'Regla: Supervisor Diego solo puede estar Observando (sin asignaci\u00f3n operativa)' },
    BREAK_SLOT_BLOCKED: { code: 'BREAK_SLOT_BLOCKED', msg: 'Slot bloqueado (ventana de embarque)' },
    BREAK_DURING_BOARDING: { code: 'BREAK_DURING_BOARDING', msg: 'Regla: descanso durante ventana de embarque' },
    BREAK_OVERLAPS_CRITICAL: { code: 'BREAK_OVERLAPS_CRITICAL', msg: 'Regla: descanso se solapa con posici\u00f3n cr\u00edtica' },
    BREAK_REQUIRED_ADUANA: { code: 'BREAK_REQUIRED_ADUANA', msg: 'Regla: Aduana requiere descanso programado antes de la operaci\u00f3n' },
    BREAK_WINDOW_ADUANA: { code: 'BREAK_WINDOW_ADUANA', msg: 'Regla: break de Aduana debe terminar antes del inicio de operaci\u00f3n/servicio' },
  };

  // ═══════════════════════════════════════════════════════════════════
  // CARGA DE config.json
  // ═══════════════════════════════════════════════════════════════════
  // Si config.js ya cargó los datos (carga síncrona), no hacemos fetch
  if (!window.__CONFIG) {
    fetch('config.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        window.__CONFIG = data;
        validateConfig();
      })
      .catch(function () {
        window.__CONFIG = null;
        validateConfig();
      });
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDACIÓN DE DATOS — pantalla de error si faltan
  // ═══════════════════════════════════════════════════════════════════
  function validateConfig() {
    var cfg = window.__CONFIG;
    var errors = [];

    if (!cfg || typeof cfg !== 'object') {
      errors.push('window.__CONFIG no está cargado');
    } else {
      if (!Array.isArray(cfg.agentes) || cfg.agentes.length === 0) {
        errors.push('No hay agentes en la configuración (data/agentes.json)');
      }
      if (!Array.isArray(cfg.positionsNormal) || cfg.positionsNormal.length === 0) {
        errors.push('No hay posiciones definidas (data/posiciones.json)');
      }
      var agentesSinPatron = (cfg.agentes || []).filter(function(a){ return !(a.descansoPatron && a.descansoPatron.diasDescanso) && !a.descansos; });
      if (agentesSinPatron.length > 0) {
        errors.push(agentesSinPatron.length + ' agente(s) sin descansos configurados (revisa data/agentes.json)');
      }
    }

    if (errors.length > 0) {
      showFatalError(errors);
    }
  }

  function showFatalError(errors) {
    var msg = errors.join('\\n');
    var html = [
      '<div id="stbc-fatal-error" style="',
      'position:fixed;top:0;left:0;right:0;bottom:0;',
      'background:#7f1d1d;color:#fff;z-index:99999;',
      'display:flex;align-items:center;justify-content:center;',
      'flex-direction:column;font-family:sans-serif;padding:24px;',
      'text-align:center;',
      '">',
      '<div style="font-size:64px;margin-bottom:16px;">🚫</div>',
      '<div style="font-size:28px;font-weight:700;margin-bottom:12px;">EL SISTEMA NO PUEDE ARRANCAR</div>',
      '<div style="font-size:16px;opacity:0.9;max-width:520px;line-height:1.5;">',
      'No se encontraron los datos de configuración necesarios para generar asignaciones.<br><br>',
      '<strong>Posibles causas:</strong><br>',
      '• Falta el archivo <code>config.js</code> o <code>config.json</code><br>',
      '• Los archivos en <code>data/</code> están vacíos o mal formados<br>',
      '• No se ejecutó <code>node build.js</code> después de editar los datos<br><br>',
      '<strong>Errores detectados:</strong><br>',
      '<pre style="text-align:left;background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;margin-top:8px;font-size:13px;overflow:auto;max-height:200px;">' + msg + '</pre>',
      '</div>',
      '<div style="margin-top:24px;font-size:13px;opacity:0.7;">',
      'Si editaste los archivos JSON manualmente, verifica que no falte ninguna coma.',
      '</div>',
      '</div>'
    ].join('');

    function inject() {
      if (document.body) {
        document.body.insertAdjacentHTML('beforeend', html);
      } else {
        setTimeout(inject, 50);
      }
    }
    inject();

    // Bloquear initApp si existe para evitar que el sistema arranque medio roto
    if (window.PLANNER && window.PLANNER.init) {
      var _origInit = window.PLANNER.init;
      window.PLANNER.init = function() {
        console.error('[STBC] PLANNER.init() bloqueado porque los datos no cargaron.');
      };
    }
  }

  function getConfig() {
    return window.__CONFIG || {};
  }

  // ═══════════════════════════════════════════════════════════════════
  // VARIABLES INTERNAS MUTABLES
  // ═══════════════════════════════════════════════════════════════════
  let _scheduleOverride = null;
  let _gateAgentId = null;

  // ═══════════════════════════════════════════════════════════════════
  // FUNCIONES DE CONTEXTO
  // ═══════════════════════════════════════════════════════════════════

  function setScheduleOverride(val) {
    _scheduleOverride = (val === 'verano_mex' || val === 'normal') ? val : null;
  }

  function getScheduleOverride() { return _scheduleOverride; }

  function isVeranoMEX(date) {
    if (_scheduleOverride === 'normal')     return false;
    if (_scheduleOverride === 'verano_mex') return true;
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= SCHEDULE.VERANO_MEX_START;
  }

  function isAF179Filtered(date) {
    if (!isVeranoMEX(date)) return false;
    var dow = date.getDay();
    return dow === 2 || dow === 4;
  }

  function getActivePositions(date) {
    var cfg = getConfig();
    var base = isVeranoMEX(date)
      ? (cfg.positionsVeranoMex || FALLBACK_POSITIONS_VERANO_MEX)
      : (cfg.positionsNormal || FALLBACK_POSITIONS_NORMAL);

    if (!isAF179Filtered(date)) return base;

    return base
      .filter(function (p) { return p.id !== 'embarque_af179'; })
      .map(function (p) {
        if (p.id.startsWith('mostrador_')) {
          return Object.assign({}, p, { time: p.time.replace('15:30-', '16:00-') });
        }
        return p;
      });
  }

  function getBreakSlotsVeranoMEX(date) {
    var dow = date.getDay();
    if (dow === 2 || dow === 4) {
      return [{ time: '14:33-15:33', start: -27, max: 40, blocked: false }];
    }
    return [
      { time: '15:53-16:53', start: 53,  max: 7, blocked: false },
      { time: '16:07-17:07', start: 67,  max: 7, blocked: false },
      { time: '16:57-17:57', start: 117, max: 7, blocked: false },
      { time: '17:54-18:54', start: 174, max: 6, blocked: false },
      { time: '18:23-19:23', start: 203, max: 6, blocked: false },
      { time: '18:56-19:56', start: 236, max: 6, blocked: false },
      { time: '19:53-20:53', start: 293, max: 5, blocked: false },
    ];
  }

  function getActiveBreakSlots(date) {
    if (isVeranoMEX(date)) return getBreakSlotsVeranoMEX(date);
    var cfg = getConfig();
    var slots = cfg.breakSlotsNormal || FALLBACK_BREAK_SLOTS_NORMAL;
    return slots.slice();
  }

  function getBlockedBreakWindows() {
    var cfg = getConfig();
    return cfg.blockedBreakWindows || FALLBACK_BLOCKED_BREAK_WINDOWS;
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILIDADES DE TIEMPO
  // ═══════════════════════════════════════════════════════════════════

  function timeStrToMinutes(timeStr) {
    var parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function parsePositionTime(timeStr) {
    var parts = timeStr.split('-');
    return { start: timeStrToMinutes(parts[0]), end: timeStrToMinutes(parts[1]) };
  }

  function timesOverlap(s1, e1, s2, e2) {
    return s1 < e2 && e1 > s2;
  }

  function positionsConflict(posA, posB) {
    var a = parsePositionTime(posA.time);
    var b = parsePositionTime(posB.time);
    return timesOverlap(a.start, a.end, b.start, b.end);
  }

  function breakOverlapsPosition(slotStart, positionTime) {
    var breakStartMin = 900 + slotStart;
    var breakEndMin = breakStartMin + 60;
    var pos = parsePositionTime(positionTime);
    return timesOverlap(breakStartMin, breakEndMin, pos.start, pos.end);
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE ELEGIBILIDAD DE AGENTE
  // ═══════════════════════════════════════════════════════════════════

  function getAgentRestrictions(agentId) {
    var ag = window.ROSTER && window.ROSTER.agentes ? window.ROSTER.agentes : [];
    for (var i = 0; i < ag.length; i++) {
      if (ag[i].id === agentId) return ag[i].restricciones || [];
    }
    return [];
  }

  function isNoOperativo(agentId) {
    var res = getAgentRestrictions(agentId);
    for (var i = 0; i < res.length; i++) {
      if (res[i].tipo === 'noOperativo') return true;
    }
    return false;
  }

  function isDiasBloqueados(agentId, date) {
    var res = getAgentRestrictions(agentId);
    var dow = date.getDay();
    for (var i = 0; i < res.length; i++) {
      if (res[i].tipo === 'diasBloqueados' && res[i].dias && res[i].dias.indexOf(dow) !== -1) return true;
    }
    return false;
  }

  function isTrainee(agentId) {
    var res = getAgentRestrictions(agentId);
    for (var i = 0; i < res.length; i++) {
      if (res[i].tipo === 'trainee') return true;
    }
    return false;
  }

  function applyPersonalRestrictions(agentId, targetPosition, date) {
    var violations = [];
    if (isNoOperativo(agentId)) {
      violations.push(RESTRICTIONS.DIEGO_ASSIGNMENT_BLOCKED);
    }
    return violations;
  }

  function canAgentBeAssigned(agentId, date) {
    if (isDiasBloqueados(agentId, date)) return false;
    var st = window.ROSTER.getAgentStatus(agentId, date);
    return st.canWork || st.status === 'curso' || st.status === 'curso-recurrente';
  }

  function canAgentHaveBreak(agentId, date) {
    if (isDiasBloqueados(agentId, date)) return false;
    var st = window.ROSTER.getAgentStatus(agentId, date);
    if (st.status === 'curso' || st.status === 'curso-recurrente') return false;
    return st.canWork;
  }

  function isAgentInCourse(agentId, date) {
    var st = window.ROSTER.getAgentStatus(agentId, date);
    return st.status === 'curso' || st.status === 'curso-recurrente';
  }

  function isDiegoRestricted(agentId) {
    return isNoOperativo(agentId);
  }

  function isNewTrainee(agentId) {
    return isTrainee(agentId);
  }

  function isMostradorPos(pos) { return !!pos && typeof pos.id === 'string' && pos.id.startsWith('mostrador_'); }
  function isEmbarquePos(pos) { return !!pos && typeof pos.id === 'string' && pos.id.startsWith('embarque_'); }
  function isKlmBoarding(pos) { return !!pos && pos.id === 'embarque_kl686'; }
  function isAduanaPos(pos) { return !!pos && pos.area === 'aduana'; }
  function isLobyPos(pos) { return !!pos && pos.id === 'loby_prep_mostradores'; }

  function isAllowedMobilityOverlap(existingPos, targetPos) {
    if (isAduanaPos(existingPos) || isAduanaPos(targetPos)) return false;
    if (isKlmBoarding(existingPos) || isKlmBoarding(targetPos)) return false;
    if (isLobyPos(existingPos) || isLobyPos(targetPos)) return true;
    return isMostradorPos(existingPos) && isEmbarquePos(targetPos);
  }

  function getAgentShiftEndMinutes(agentId, date) {
    if (isAgentInCourse(agentId, date)) return 22 * 60;
    var schedule = isVeranoMEX(date) ? SCHEDULE.VERANO_MEX : SCHEDULE.NORMAL;
    return parsePositionTime(schedule.start + '-' + schedule.end).end;
  }

  function getPositionSequenceType(positionId) {
    if (positionId === 'recibe') return 'recibe';
    if (positionId === 'equipaje_general') return 'aduana';
    if (positionId === 'quiosco') return 'quiosco';
    if (positionId.startsWith('embarque_')) return 'embarque';
    if (positionId.startsWith('mostrador_')) return 'mostrador';
    if (positionId.startsWith('supervisor_')) return 'supervisor';
    return positionId;
  }

  function getAduanaWindow(date) {
    var pos = getActivePositions(date).find(function (p) { return p.area === 'aduana'; });
    if (!pos) return null;
    var t = parsePositionTime(pos.time);
    return { start: t.start, end: t.end, posId: pos.id };
  }

  function agentHasAduanaAssignment(agentAssignedPositions) {
    return agentAssignedPositions.some(function (p) { return p.area === 'aduana'; });
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE ASIGNACIÓN DE POSICIÓN
  // ═══════════════════════════════════════════════════════════════════

  function agentHasSkills(agent, position) {
    return position.skills.every(function (sk) { return (agent.skills[sk] || 0) >= 0.5; });
  }

  function violatesRecibeEmbarqueRule(agentAssignedPositions, targetPosition) {
    var targetIsEmbarque = targetPosition.id.startsWith('embarque_');
    var targetIsRecibe   = targetPosition.id === 'recibe';

    if (targetIsEmbarque) {
      return agentAssignedPositions.some(function (p) { return p.id === 'recibe'; });
    }
    if (targetIsRecibe) {
      return agentAssignedPositions.some(function (p) { return p.id.startsWith('embarque_'); });
    }
    return false;
  }

  function exceedsEmbarqueLimit(agentAssignedPositions, targetPosition) {
    if (!targetPosition.id.startsWith('embarque_')) return false;
    var currentEmbarques = agentAssignedPositions.filter(function (p) { return p.id.startsWith('embarque_'); }).length;
    return currentEmbarques >= MAX_EMBARQUES_PER_AGENT;
  }

  function courseAgentExceedsSchedule(agentId, position, date) {
    if (!isAgentInCourse(agentId, date)) return false;
    var posEnd = parsePositionTime(position.time).end;
    return posEnd > 22 * 60;
  }

  function agentExceedsShiftEnd(agentId, position, date) {
    var posEnd = parsePositionTime(position.time).end;
    var shiftEnd = getAgentShiftEndMinutes(agentId, date);
    return posEnd > shiftEnd;
  }

  function evaluatePositionAssignment(agent, targetPosition, agentAssignedPositions, date, agentHasBreakFlag) {
    var violations = [];
    var hasAduana = agentAssignedPositions.some(function (p) { return isAduanaPos(p); });
    var hasKlm = agentAssignedPositions.some(function (p) { return isKlmBoarding(p); });
    var hasEmbarque = agentAssignedPositions.some(function (p) { return isEmbarquePos(p); });
    var hasMostrador = agentAssignedPositions.some(function (p) { return isMostradorPos(p); });

    if (isAduanaPos(targetPosition)) {
      if (agentAssignedPositions.length > 0) violations.push(RESTRICTIONS.ADUANA_ISOLATED);
    } else if (hasAduana) {
      violations.push(RESTRICTIONS.ADUANA_ISOLATED);
    }

    if (isKlmBoarding(targetPosition)) {
      if (agentAssignedPositions.length > 0) violations.push(RESTRICTIONS.KLM_DEDICATED);
    } else if (hasKlm) {
      violations.push(RESTRICTIONS.KLM_DEDICATED);
    }

    if (isMostradorPos(targetPosition) && hasEmbarque) {
      violations.push(RESTRICTIONS.BOARDING_TO_COUNTER_FORBIDDEN);
    }

    if (targetPosition.critical) {
      var crit = agentAssignedPositions.filter(function (p) { return p.critical; });
      if (crit.length > 0) {
        var allowed =
          (isEmbarquePos(targetPosition) && crit.every(function (p) { return isEmbarquePos(p); })) ||
          (isEmbarquePos(targetPosition) && hasMostrador);
        if (!allowed) violations.push(RESTRICTIONS.CRITICAL_SHARING_FORBIDDEN);
      }
    }

    var personalRests = applyPersonalRestrictions(agent.id, targetPosition, date);
    violations = violations.concat(personalRests);
    if (!canAgentBeAssigned(agent.id, date)) {
      violations.push(RESTRICTIONS.AGENT_NOT_ASSIGNABLE);
    }
    if (agentHasBreakFlag) {
      violations.push(RESTRICTIONS.AGENT_HAS_BREAK);
    }
    if (!agentHasSkills(agent, targetPosition)) {
      violations.push(RESTRICTIONS.SKILLS_INSUFFICIENT);
    }
    if (violatesRecibeEmbarqueRule(agentAssignedPositions, targetPosition)) {
      violations.push(RESTRICTIONS.RECIBE_EMBARQUE_EXCLUSION);
    }
    if (exceedsEmbarqueLimit(agentAssignedPositions, targetPosition)) {
      violations.push(RESTRICTIONS.EMBARQUE_LIMIT);
    }
    if (courseAgentExceedsSchedule(agent.id, targetPosition, date)) {
      violations.push(RESTRICTIONS.COURSE_SHIFT_END);
    }
    if (agentExceedsShiftEnd(agent.id, targetPosition, date)) {
      violations.push(RESTRICTIONS.SHIFT_END);
    }
    if (observacionRestricted(agent.id, targetPosition, date)) {
      violations.push(RESTRICTIONS.OBSERVACION_RESTRICTED);
    }
    var conflict = agentAssignedPositions.some(function (p) {
      return positionsConflict(targetPosition, p) && !isAllowedMobilityOverlap(p, targetPosition);
    });
    if (conflict) violations.push(RESTRICTIONS.TIME_CONFLICT);
    return { ok: violations.length === 0, violations: violations };
  }

  function observacionRestricted(agentId, position, date) {
    if (!window.ROSTER || !window.ROSTER.isAgentInObservacion) return false;
    if (!window.ROSTER.isAgentInObservacion(agentId, date)) return false;
    var pid = position.id;
    return pid !== 'mostrador_econ' && !pid.startsWith('mostrador_prio');
  }

  function canAgentTakePosition(agent, targetPosition, agentAssignedPositions, date, agentHasBreakFlag) {
    return evaluatePositionAssignment(agent, targetPosition, agentAssignedPositions, date, agentHasBreakFlag).ok;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE DESCANSO
  // ═══════════════════════════════════════════════════════════════════

  function isBoardingBlocked(agentAssignedPositions, breakSlot) {
    return agentAssignedPositions.some(function (p) {
      if (!p.id.startsWith('embarque_')) return false;
      return breakOverlapsPosition(breakSlot.start, p.time);
    });
  }

  function isBreakCompatible(agentAssignedPositions, breakSlot) {
    if (isBoardingBlocked(agentAssignedPositions, breakSlot)) return false;
    var okCritical = agentAssignedPositions.every(function (p) {
      if (!p.critical) return true;
      return !breakOverlapsPosition(breakSlot.start, p.time);
    });
    if (!okCritical) return false;
    var aduanaPos = agentAssignedPositions.find(function (p) { return p.area === 'aduana'; });
    if (aduanaPos) {
      var brStart = 900 + breakSlot.start;
      var brEnd = brStart + 60;
      var ad = parsePositionTime(aduanaPos.time);
      if (!(brStart < ad.start && brEnd <= ad.start)) return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════════

  function canAgentCover(agent, position, date, agentAssignedPositions, agentBreakStart, coverageWindowStart, coverageWindowEnd, currentCoverageCount) {
    if (!canAgentBeAssigned(agent.id, date)) return false;

    var isSup       = agent.type === 'supervisor';
    var isEmbarque  = position.id.startsWith('embarque_');
    var isGateAgent = _getGateAgentId() === agent.id;

    if (isSup && isGateAgent && !isEmbarque) return false;
    if (isSup && !isGateAgent && isEmbarque) return false;

    if (position.id === 'supervisor_gate') return false;

    if (!isSup && (currentCoverageCount || 0) >= MAX_COBERTURAS_TRAFFIC) return false;

    if (agentBreakStart !== undefined) {
      var agentBreakStartMdn = 900 + agentBreakStart;
      var agentBreakEndMdn   = agentBreakStartMdn + 60;
      if (timesOverlap(agentBreakStartMdn, agentBreakEndMdn, coverageWindowStart, coverageWindowEnd)) return false;
    }

    if (isEmbarque) {
      if (agentAssignedPositions.some(function (p) { return p.critical; })) return false;
    }

    var noConflict = agentAssignedPositions.every(function (p) {
      var pt = parsePositionTime(p.time);
      return !timesOverlap(pt.start, pt.end, coverageWindowStart, coverageWindowEnd);
    });
    if (!noConflict) return false;

    return agentHasSkills(agent, position);
  }

  function _setGateAgentId(id) { _gateAgentId = id; }
  function _getGateAgentId()   { return _gateAgentId; }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE ROLES DE ABORDAJE
  // ═══════════════════════════════════════════════════════════════════

  function resolveBoardingRoles(posId, assignedAgents, yesterdayRoles) {
    assignedAgents = (assignedAgents || []).filter(function (a) { return !isDiegoRestricted(a.id); });
    var titAyer = (yesterdayRoles && yesterdayRoles.titular) || null;
    var bagAyer = (yesterdayRoles && yesterdayRoles.bags)    || null;

    var titSort = function (a, b) {
      if (a.id === titAyer && b.id !== titAyer) return 1;
      if (b.id === titAyer && a.id !== titAyer) return -1;
      return (b.skills.A2 || 0) - (a.skills.A2 || 0);
    };
    var titCand075 = assignedAgents.filter(function (a) { return (a.skills.A2 || 0) >= MIN_BOARDING_ROLE_SKILL; }).sort(titSort);
    var titCand050 = assignedAgents.filter(function (a) { return (a.skills.A2 || 0) >= 0.5; }).sort(titSort);
    var titularAgent = (titCand075.length > 0 ? titCand075 : titCand050)[0] || null;

    var bagSort = function (a, b) {
      if (a.id === bagAyer && b.id !== bagAyer) return 1;
      if (b.id === bagAyer && a.id !== bagAyer) return -1;
      return (b.skills.A1 || 0) - (a.skills.A1 || 0);
    };
    var bagCand075 = assignedAgents.filter(function (a) { return (a.skills.A1 || 0) >= MIN_BOARDING_ROLE_SKILL && a !== titularAgent; }).sort(bagSort);
    var bagCand050 = assignedAgents.filter(function (a) { return (a.skills.A1 || 0) >= 0.5 && a !== titularAgent; }).sort(bagSort);
    var bagAgent = (bagCand075.length > 0 ? bagCand075 : bagCand050)[0] || null;

    return { titularAgent: titularAgent, bagAgent: bagAgent };
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDACIONES
  // ═══════════════════════════════════════════════════════════════════

  function validate(assignments, breaks, coberturas, date, boardingRoles, sombras) {
    boardingRoles = boardingRoles || {};
    sombras = sombras || {};
    var issues = [];
    var positions = getActivePositions(date);
    var allAgents = (
      (window.ROSTER.trafficAgents || []).concat(window.ROSTER.supervisorAgents || [])
    );

    allAgents.forEach(function (a) {
      if (!isNoOperativo(a.id)) return;
      var inAssignments = Object.keys(assignments || {}).some(function (posId) {
        return (assignments[posId] || []).indexOf(a.id) !== -1;
      });
      var inSombras = Object.keys(sombras || {}).some(function (posId) {
        return (sombras[posId] || []).indexOf(a.id) !== -1;
      });
      var inRoles = Object.keys(boardingRoles || {}).some(function (posId) {
        var r = boardingRoles[posId];
        return r && (r.titular === a.id || r.bags === a.id);
      });
      if (inAssignments || inSombras || inRoles) {
        issues.push({ type: 'error', msg: a.name + ': no puede ser Titular ni Sombra ni asignaci\u00f3n operativa (solo Observando)' });
      }
    });

    var availableCount = allAgents.filter(function (a) { return canAgentBeAssigned(a.id, date); }).length;
    if (availableCount < 10) {
      issues.push({ type: 'error', msg: 'Solo ' + availableCount + ' agentes disponibles (m\u00ednimo 10)' });
    }

    positions.filter(function (p) { return p.critical && p.pool === 'traffic'; }).forEach(function (pos) {
      var assigned = (assignments[pos.id] || []).filter(function (id) { return canAgentBeAssigned(id, date); });
      if (assigned.length < pos.minAgents) {
        issues.push({ type: 'error', msg: pos.name + ': ' + assigned.length + '/' + pos.minAgents + ' agentes (cr\u00edtica)' });
      }
    });

    Object.keys(assignments || {}).forEach(function (posId) {
      (assignments[posId] || []).forEach(function (id) {
        if (!canAgentBeAssigned(id, date)) {
          var a = allAgents.find(function (x) { return x.id === id; });
          issues.push({ type: 'error', msg: (a ? a.name : id) + ' no disponible pero tiene posici\u00f3n' });
        }
      });
    });

    allAgents.forEach(function (agent) {
      var agentPos = positions.filter(function (p) { return (assignments[p.id] || []).indexOf(agent.id) !== -1; });

      var hasAduana = agentPos.some(function (p) { return isAduanaPos(p); });
      if (hasAduana && agentPos.length > 1) {
        issues.push({ type: 'error', msg: agent.name + ': Aduana no puede compartir personal con ninguna otra asignaci\u00f3n' });
      }

      var hasKlm = agentPos.some(function (p) { return isKlmBoarding(p); });
      if (hasKlm && agentPos.length > 1) {
        issues.push({ type: 'error', msg: agent.name + ': KLM requiere agente dedicado (sin otras asignaciones)' });
      }

      var hasLoby = agentPos.some(function (p) { return isLobyPos(p); });
      if (hasLoby && agentPos.length === 1) {
        issues.push({ type: 'error', msg: agent.name + ': Loby/Preparar Mostradores no puede ser su \u00fanica funci\u00f3n' });
      }

      for (var i = 0; i < agentPos.length; i++) {
        for (var j = i + 1; j < agentPos.length; j++) {
          var a = agentPos[i];
          var b = agentPos[j];
          if (!positionsConflict(a, b)) continue;
          var allowed = isAllowedMobilityOverlap(a, b) || isAllowedMobilityOverlap(b, a);
          if (!allowed) {
            issues.push({ type: 'error', msg: agent.name + ': solapamiento no permitido entre ' + a.name + ' y ' + b.name });
          }
        }
      }
    });

    Object.keys(assignments || {}).forEach(function (posId) {
      var pos = positions.find(function (p) { return p.id === posId; });
      if (!pos) return;
      var posEnd = parsePositionTime(pos.time).end;
      (assignments[posId] || []).forEach(function (id) {
        var shiftEnd = getAgentShiftEndMinutes(id, date);
        if (posEnd > shiftEnd) {
          var a = allAgents.find(function (x) { return x.id === id; });
          issues.push({ type: 'error', msg: (a ? a.name : id) + ': ' + pos.name + ' termina ' + padTime(Math.floor(posEnd / 60)) + ':' + padTime(posEnd % 60) + ' y su salida es ' + padTime(Math.floor(shiftEnd / 60)) + ':' + padTime(shiftEnd % 60) });
        }
      });
    });

    allAgents.forEach(function (agent) {
      var agentPos = positions.filter(function (p) { return (assignments[p.id] || []).indexOf(agent.id) !== -1; });
      var hasRecibe   = agentPos.some(function (p) { return p.id === 'recibe'; });
      var hasEmbarque = agentPos.some(function (p) { return p.id.startsWith('embarque_'); });
      if (hasRecibe && hasEmbarque) {
        issues.push({ type: 'error', msg: agent.name + ': tiene Recibe Y Embarque (regla exclusi\u00f3n)' });
      }
    });

    allAgents.forEach(function (agent) {
      var embarques = positions.filter(function (p) {
        return p.id.startsWith('embarque_') && (assignments[p.id] || []).indexOf(agent.id) !== -1;
      });
      if (embarques.length > MAX_EMBARQUES_PER_AGENT) {
        issues.push({ type: 'error', msg: agent.name + ': ' + embarques.length + ' embarques asignados (m\u00e1x ' + MAX_EMBARQUES_PER_AGENT + ')' });
      }
    });

    allAgents.forEach(function (agent) {
      if (breaks[agent.id] === undefined) return;
      var slot = { start: breaks[agent.id] };
      var agentPos = positions.filter(function (p) { return (assignments[p.id] || []).indexOf(agent.id) !== -1; });
      if (isBoardingBlocked(agentPos, slot)) {
        issues.push({ type: 'error', msg: agent.name + ': descanso durante ventana de embarque' });
      }
    });

    allAgents.forEach(function (agent) {
      var agentPos = positions.filter(function (p) { return (assignments[p.id] || []).indexOf(agent.id) !== -1; });
      var aduanaPos = agentPos.find(function (p) { return p.area === 'aduana'; });
      if (!aduanaPos) return;
      if (breaks[agent.id] === undefined) {
        issues.push({ type: 'error', msg: agent.name + ': Aduana sin descanso programado antes de operaci\u00f3n' });
        return;
      }
      var brStart = 900 + breaks[agent.id];
      var brEnd = brStart + 60;
      var ad = parsePositionTime(aduanaPos.time);
      if (!(brStart < ad.start && brEnd <= ad.start)) {
        issues.push({ type: 'error', msg: agent.name + ': descanso no cumple ventana Aduana (debe terminar antes de ' + aduanaPos.time.split('-')[0] + ')' });
      }
    });

    var needBreak = allAgents.filter(function (a) { return canAgentHaveBreak(a.id, date); });
    var withoutBreak = needBreak.filter(function (a) { return breaks[a.id] === undefined; });
    if (withoutBreak.length > 0) {
      issues.push({ type: 'warning', msg: withoutBreak.length + ' agente(s) sin descanso asignado' });
    }

    Object.keys(coberturas || {}).forEach(function (posId) {
      (coberturas[posId] || []).forEach(function (cob) {
        if (!canAgentBeAssigned(cob.agentId, date)) {
          var a = allAgents.find(function (x) { return x.id === cob.agentId; });
          issues.push({ type: 'error', msg: (a ? a.name : cob.agentId) + ': cubre pero no est\u00e1 disponible (descanso calendario)' });
        }
      });
    });

    Object.keys(assignments || {}).forEach(function (posId) {
      var pos = positions.find(function (p) { return p.id === posId; });
      if (!pos || !pos.critical) return;
      var slots = getActiveBreakSlots(date);
      (assignments[posId] || []).forEach(function (agentId) {
        if (breaks[agentId] === undefined) return;
        var sl = slots.find(function (s) { return s.start === breaks[agentId]; });
        if (!sl || sl.blocked) return;
        if (!breakOverlapsPosition(sl.start, pos.time)) return;
        var posCobs = coberturas[posId] || [];
        var covered = posCobs.some(function (c) { return c.titularId === agentId; });
        if (!covered) {
          var a = allAgents.find(function (x) { return x.id === agentId; });
          issues.push({ type: 'error', msg: pos.name + ': ' + (a ? a.name : agentId) + ' en descanso sin cobertura asignada' });
        }
      });
    });

    Object.keys(boardingRoles || {}).forEach(function (posId) {
      var pos = positions.find(function (p) { return p.id === posId; });
      if (!pos) return;
      var roles = boardingRoles[posId];
      if (!roles.titular) {
        issues.push({ type: 'error', msg: pos.name + ': sin Titular asignado (requiere A2 \u2265 ' + MIN_BOARDING_ROLE_SKILL + ')' });
      } else {
        var ag = allAgents.find(function (a) { return a.id === roles.titular; });
        if (ag) {
          var skill = ag.skills.A2 || 0;
          if (skill < 0.5) {
            issues.push({ type: 'error', msg: ag.name + ': Titular en ' + pos.name + ' con A2 insuficiente (tiene ' + skill + ', m\u00edn 0.50)' });
          } else if (skill < MIN_BOARDING_ROLE_SKILL) {
            issues.push({ type: 'warning', msg: ag.name + ': Titular en ' + pos.name + ' con A2 de respaldo (tiene ' + skill + ', \u00f3ptimo ' + MIN_BOARDING_ROLE_SKILL + ')' });
          }
        }
      }
      if (!roles.bags) {
        issues.push({ type: 'error', msg: pos.name + ': sin Bags/Pendientes asignado (requiere A1 \u2265 ' + MIN_BOARDING_ROLE_SKILL + ')' });
      } else {
        var ag2 = allAgents.find(function (a) { return a.id === roles.bags; });
        if (ag2) {
          var skill2 = ag2.skills.A1 || 0;
          if (skill2 < 0.5) {
            issues.push({ type: 'error', msg: ag2.name + ': Bags en ' + pos.name + ' con A1 insuficiente (tiene ' + skill2 + ', m\u00edn 0.50)' });
          } else if (skill2 < MIN_BOARDING_ROLE_SKILL) {
            issues.push({ type: 'warning', msg: ag2.name + ': Bags en ' + pos.name + ' con A1 de respaldo (tiene ' + skill2 + ', \u00f3ptimo ' + MIN_BOARDING_ROLE_SKILL + ')' });
          }
        }
      }
    });

    return issues;
  }

  function padTime(n) {
    return n < 10 ? '0' + n : String(n);
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPOSICIÓN PÚBLICA
  // ═══════════════════════════════════════════════════════════════════
  window.RULES = {
    SCHEDULE: SCHEDULE,
    STORAGE: STORAGE,
    MAX_REPS_TRAFFIC: MAX_REPS_TRAFFIC,
    MAX_REPS_SUPERVISOR: MAX_REPS_SUPERVISOR,
    MAX_REPS_RECIBE: MAX_REPS_RECIBE,
    MAX_EMBARQUES_PER_AGENT: MAX_EMBARQUES_PER_AGENT,
    MAX_COBERTURAS_TRAFFIC: MAX_COBERTURAS_TRAFFIC,
    MIN_BOARDING_ROLE_SKILL: MIN_BOARDING_ROLE_SKILL,
    RESTRICTIONS: RESTRICTIONS,

    get POSITIONS_NORMAL() {
      var cfg = getConfig();
      return cfg.positionsNormal || FALLBACK_POSITIONS_NORMAL;
    },
    get POSITIONS_VERANO_MEX() {
      var cfg = getConfig();
      return cfg.positionsVeranoMex || FALLBACK_POSITIONS_VERANO_MEX;
    },
    get BREAK_SLOTS_NORMAL() {
      var cfg = getConfig();
      return cfg.breakSlotsNormal || FALLBACK_BREAK_SLOTS_NORMAL;
    },
    get BLOCKED_BREAK_WINDOWS() {
      return getBlockedBreakWindows();
    },

    setScheduleOverride: setScheduleOverride,
    getScheduleOverride: getScheduleOverride,
    isVeranoMEX: isVeranoMEX,
    isAF179Filtered: isAF179Filtered,
    getActivePositions: getActivePositions,
    getActiveBreakSlots: getActiveBreakSlots,

    timeStrToMinutes: timeStrToMinutes,
    parsePositionTime: parsePositionTime,
    timesOverlap: timesOverlap,
    positionsConflict: positionsConflict,
    breakOverlapsPosition: breakOverlapsPosition,

    getAgentRestrictions: getAgentRestrictions,
    applyPersonalRestrictions: applyPersonalRestrictions,
    isNoOperativo: isNoOperativo,
    isDiasBloqueados: isDiasBloqueados,
    isTrainee: isTrainee,
    isDiegoRestricted: isDiegoRestricted,
    isNewTrainee: isNewTrainee,
    getAgentShiftEndMinutes: getAgentShiftEndMinutes,
    getPositionSequenceType: getPositionSequenceType,
    getAduanaWindow: getAduanaWindow,
    agentHasAduanaAssignment: agentHasAduanaAssignment,
    isGamaWeekendBlocked: isDiasBloqueados,
    canAgentBeAssigned: canAgentBeAssigned,
    canAgentHaveBreak: canAgentHaveBreak,
    isAgentInCourse: isAgentInCourse,
    agentHasSkills: agentHasSkills,

    violatesRecibeEmbarqueRule: violatesRecibeEmbarqueRule,
    exceedsEmbarqueLimit: exceedsEmbarqueLimit,
    courseAgentExceedsSchedule: courseAgentExceedsSchedule,
    agentExceedsShiftEnd: agentExceedsShiftEnd,
    evaluatePositionAssignment: evaluatePositionAssignment,
    observacionRestricted: observacionRestricted,
    canAgentTakePosition: canAgentTakePosition,

    isBoardingBlocked: isBoardingBlocked,
    isBreakCompatible: isBreakCompatible,

    canAgentCover: canAgentCover,
    _setGateAgentId: _setGateAgentId,
    _getGateAgentId: _getGateAgentId,

    resolveBoardingRoles: resolveBoardingRoles,

    validate: validate,
  };

  // Validación inmediata si config.js ya cargó los datos
  if (window.__CONFIG) {
    validateConfig();
  }

})();
