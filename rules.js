/**
 * rules.js — Reglas operativas STBC · AF/KL MEX T1
 * Sistema de Todo Bajo Control (según) · Tlacuache Ops
 *
 * IMPORTANTE: Este archivo NO contiene lógica de asignación.
 * Solo define constantes, estructuras de posiciones, slots de descanso,
 * y funciones de validación pura (sin efectos secundarios).
 *
 * Cargarlo ANTES que planner.js y DESPUÉS de roster-data.js.
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // CONSTANTES GLOBALES
  // ═══════════════════════════════════════════════════════════════════

  const SCHEDULE = {
    VERANO_MEX_START: new Date(2026, 2, 29), // 29 de marzo de 2026
    NORMAL: {
      name: 'Normal',
      start: '15:00',
      end: '23:30',
      startMin: 0,    // minutos desde 15:00
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

  // Límites de repetición consecutiva de posición (días calendario)
  const MAX_REPS_TRAFFIC    = 2;
  const MAX_REPS_SUPERVISOR = 2;
  const MAX_REPS_RECIBE     = 1; // rotación diaria obligatoria

  // Skill mínimo para roles de abordaje (Titular y Bags/Pendientes)
  const MIN_BOARDING_ROLE_SKILL = 0.75;

  // Máximo de embarques por agente en un mismo turno
  const MAX_EMBARQUES_PER_AGENT = 2;

  // Máximo de coberturas por agente de tráfico en un turno
  const MAX_COBERTURAS_TRAFFIC = 2;

  // LocalStorage keys
  const STORAGE = {
    ASSIGNMENTS:    'wfm_assignments',
    BREAKS:         'wfm_breaks',
    COBERTURAS:     'wfm_coberturas',
    HISTORY:        'wfm_agent_history',
    BOARDING_ROLES: 'wfm_boarding_roles',
    THEME:          'stbc-theme',
  };

  // ═══════════════════════════════════════════════════════════════════
  // POSICIONES — Horario Normal (15:00–23:30)
  // pool: 'traffic' | 'supervisor'
  // critical: true = no puede abandonar la posición para cubrir otras
  // requiresBag: true = debe haber al menos un agente con A1 >= 0.5
  // multiAssign: true = un supervisor puede tener más de una a la vez
  // shared: true = cubre varias posiciones inbound
  // ═══════════════════════════════════════════════════════════════════
  const POSITIONS_NORMAL = [
    { id: 'recibe',             name: 'Migracion/Recepcion de vuelos',      time: '17:25-21:15', minAgents: 1, skills: ['A0'], critical: true,  pool: 'traffic',    requiresBag: false },
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
    { id: 'equipaje_general',   name: 'Aduana/Equipaje (Todos Vuelos)',     time: '17:45-21:45', minAgents: 2, skills: ['A5'], critical: true,  pool: 'traffic',    requiresBag: false, shared: true },
    { id: 'supervisor_control', name: 'Supervisor Control',                 time: '15:00-23:30', minAgents: 1, skills: ['C4'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_caja',    name: 'Supervisor Caja',                    time: '15:00-23:30', minAgents: 1, skills: ['C1'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_gate',    name: 'Supervisor Gate',                    time: '15:00-23:30', minAgents: 1, skills: ['C0'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_s',       name: 'Supervisor S',                       time: '15:00-23:30', minAgents: 1, skills: ['C3'], critical: false, pool: 'supervisor', multiAssign: true },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // POSICIONES — Horario Verano MEX (14:30–23:00)
  // Mostradores abren 15:30 (o 16:00 en martes/jueves sin AF178/AF179)
  // ═══════════════════════════════════════════════════════════════════
  const POSITIONS_VERANO_MEX = [
    { id: 'recibe',             name: 'Migracion/Recepcion de vuelos',      time: '16:55-20:10', minAgents: 1, skills: ['A0'], critical: true,  pool: 'traffic',    requiresBag: false },
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
    { id: 'equipaje_general',   name: 'Aduana/Equipaje (Todos Vuelos)',     time: '17:15-20:30', minAgents: 2, skills: ['A5'], critical: true,  pool: 'traffic',    requiresBag: false, shared: true },
    { id: 'supervisor_control', name: 'Supervisor Control',                 time: '15:55-23:00', minAgents: 1, skills: ['C4'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_caja',    name: 'Supervisor Caja',                    time: '15:55-23:00', minAgents: 1, skills: ['C1'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_gate',    name: 'Supervisor Gate',                    time: '16:40-23:00', minAgents: 1, skills: ['C0'], critical: false, pool: 'supervisor', multiAssign: true },
    { id: 'supervisor_s',       name: 'Supervisor S',                       time: '15:55-23:00', minAgents: 1, skills: ['C3'], critical: false, pool: 'supervisor', multiAssign: true },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // SLOTS DE DESCANSO — Horario Normal
  // start = minutos desde las 15:00
  // blocked = true → no se asignan descansos en ese slot
  // ═══════════════════════════════════════════════════════════════════
  const BREAK_SLOTS_NORMAL = [
    { time: '15:00-16:00', start: 0,   max: 6, blocked: false },
    { time: '16:00-17:00', start: 60,  max: 6, blocked: false },
    { time: '17:00-18:00', start: 120, max: 5, blocked: false },
    { time: '18:00-19:00', start: 180, max: 5, blocked: false },
    { time: '19:00-20:00', start: 240, max: 0, blocked: true  }, // Abordaje AF179 + KL686
    { time: '20:00-21:00', start: 300, max: 6, blocked: false },
    { time: '21:00-22:00', start: 360, max: 0, blocked: true  }, // Abordaje AF173
    { time: '22:00-23:00', start: 420, max: 5, blocked: false },
    { time: '23:00-23:30', start: 480, max: 0, blocked: true  },
  ];

  // Ventanas bloqueadas para descansos (coinciden con embarques)
  const BLOCKED_BREAK_WINDOWS = [
    { start: 205, end: 255, reason: 'Abordaje AF179' },  // 18:25-19:15
    { start: 270, end: 305, reason: 'Abordaje KL686' },  // 19:30-20:05
    { start: 375, end: 425, reason: 'Abordaje AF173' },  // 21:15-22:05
  ];

  // ═══════════════════════════════════════════════════════════════════
  // SLOTS DE DESCANSO — Horario Verano MEX (dinámico por día)
  // Martes (2) y Jueves (4): slot universal único 14:30-15:30
  // Resto de días: 7 slots escalonados
  // ═══════════════════════════════════════════════════════════════════
  function getBreakSlotsVeranoMEX(date) {
    const dow = date.getDay();
    // Martes=2, Jueves=4 → sin AF178/AF179, slot único antes del turno
    if (dow === 2 || dow === 4) {
      return [{ time: '14:30-15:30', start: -30, max: 40, blocked: false }];
    }
    return [
      { time: '15:55-16:55', start: 55,  max: 10, blocked: false },
      { time: '16:53-17:53', start: 113, max: 10, blocked: false },
      { time: '17:51-18:51', start: 171, max: 8,  blocked: false },
      { time: '18:30-19:30', start: 210, max: 0,  blocked: true  }, // AF179
      { time: '19:49-20:49', start: 289, max: 10, blocked: false },
      { time: '20:30-21:30', start: 330, max: 0,  blocked: true  }, // KL686
      { time: '21:47-22:47', start: 407, max: 8,  blocked: false },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE DISPONIBILIDAD — funciones de validación pura
  // ═══════════════════════════════════════════════════════════════════

  // Override manual de horario. null = autodetectar por fecha.
  // 'verano_mex' | 'normal' | null
  let _scheduleOverride = null;

  function setScheduleOverride(val) {
    _scheduleOverride = (val === 'verano_mex' || val === 'normal') ? val : null;
  }

  function getScheduleOverride() { return _scheduleOverride; }

  /**
   * Detecta si la fecha cae en el período Verano MEX.
   * Si hay un override manual activo, lo respeta.
   */
  function isVeranoMEX(date) {
    if (_scheduleOverride === 'normal')     return false;
    if (_scheduleOverride === 'verano_mex') return true;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= SCHEDULE.VERANO_MEX_START;
  }

  /**
   * Detecta si en Verano MEX y en martes/jueves, AF178/AF179 no operan.
   */
  function isAF179Filtered(date) {
    if (!isVeranoMEX(date)) return false;
    const dow = date.getDay();
    return dow === 2 || dow === 4; // martes o jueves
  }

  /**
   * Retorna las posiciones activas para la fecha dada, aplicando filtros dinámicos.
   */
  function getActivePositions(date) {
    const base = isVeranoMEX(date) ? POSITIONS_VERANO_MEX : POSITIONS_NORMAL;
    if (!isAF179Filtered(date)) return base;

    // Martes/Jueves Verano MEX: quitar embarque AF179, ajustar mostradores a 16:00
    return base
      .filter(p => p.id !== 'embarque_af179')
      .map(p => {
        if (p.id.startsWith('mostrador_')) {
          return { ...p, time: p.time.replace('15:30-', '16:00-') };
        }
        return p;
      });
  }

  /**
   * Retorna los slots de descanso activos para la fecha dada.
   */
  function getActiveBreakSlots(date) {
    return isVeranoMEX(date)
      ? getBreakSlotsVeranoMEX(date)
      : [...BREAK_SLOTS_NORMAL];
  }

  /**
   * Convierte "HH:MM" a minutos desde medianoche.
   */
  function timeStrToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Parsea "HH:MM-HH:MM" → { start: minutes, end: minutes }
   */
  function parsePositionTime(timeStr) {
    const [s, e] = timeStr.split('-');
    return { start: timeStrToMinutes(s), end: timeStrToMinutes(e) };
  }

  /**
   * ¿Dos rangos de tiempo [s1,e1) y [s2,e2) se solapan?
   */
  function timesOverlap(s1, e1, s2, e2) {
    return s1 < e2 && e1 > s2;
  }

  /**
   * ¿Dos posiciones tienen conflicto horario?
   */
  function positionsConflict(posA, posB) {
    const a = parsePositionTime(posA.time);
    const b = parsePositionTime(posB.time);
    return timesOverlap(a.start, a.end, b.start, b.end);
  }

  /**
   * ¿Un slot de descanso (duración 1h) se solapa con el horario de una posición?
   * slotStart = minutos desde 15:00 (puede ser negativo en Verano MEX)
   * positionTime = "HH:MM-HH:MM"
   */
  function breakOverlapsPosition(slotStart, positionTime) {
    const breakStartMin = 900 + slotStart; // Convertir a minutos desde medianoche (15:00 = 900)
    const breakEndMin = breakStartMin + 60;
    const pos = parsePositionTime(positionTime);
    return timesOverlap(breakStartMin, breakEndMin, pos.start, pos.end);
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE ELEGIBILIDAD DE AGENTE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * REGLA ABSOLUTA: Alan Gama (2000790) no opera en sábado ni domingo.
   */
  function isGamaWeekendBlocked(agentId, date) {
    if (agentId !== '2000790') return false;
    const dow = date.getDay();
    return dow === 0 || dow === 6;
  }

  /**
   * ¿Puede el agente ser asignado a operaciones en la fecha dada?
   * Incluye agentes en curso (reincorporación a las 16:00, o 15:00 en Verano MEX).
   * FIX ERROR 4/5: solo agentes con canWork=true o en curso son asignables.
   */
  function canAgentBeAssigned(agentId, date) {
    if (isGamaWeekendBlocked(agentId, date)) return false;
    const st = window.ROSTER.getAgentStatus(agentId, date);
    return st.canWork || st.status === 'curso' || st.status === 'curso-recurrente';
  }

  /**
   * ¿Puede el agente recibir slot de alimentos?
   * Los agentes en curso tienen break integrado, no reciben slot operativo.
   */
  function canAgentHaveBreak(agentId, date) {
    if (isGamaWeekendBlocked(agentId, date)) return false;
    const st = window.ROSTER.getAgentStatus(agentId, date);
    if (st.status === 'curso' || st.status === 'curso-recurrente') return false;
    return st.canWork;
  }

  /**
   * ¿El agente está en curso en esta fecha?
   */
  function isAgentInCourse(agentId, date) {
    const st = window.ROSTER.getAgentStatus(agentId, date);
    return st.status === 'curso' || st.status === 'curso-recurrente';
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE ASIGNACIÓN DE POSICIÓN
  // ═══════════════════════════════════════════════════════════════════

  /**
   * ¿El agente tiene skill suficiente para la posición?
   * Umbral: skill >= 0.5 en todos los requeridos.
   */
  function agentHasSkills(agent, position) {
    return position.skills.every(sk => (agent.skills[sk] || 0) >= 0.5);
  }

  /**
   * REGLA ABSOLUTA: recibe ↔ embarque son mutuamente excluyentes.
   * Si el agente ya tiene 'recibe', no puede tomar embarque, y viceversa.
   */
  function violatesRecibeEmbarqueRule(agentAssignedPositions, targetPosition) {
    const targetIsEmbarque = targetPosition.id.startsWith('embarque_');
    const targetIsRecibe   = targetPosition.id === 'recibe';

    if (targetIsEmbarque) {
      return agentAssignedPositions.some(p => p.id === 'recibe');
    }
    if (targetIsRecibe) {
      return agentAssignedPositions.some(p => p.id.startsWith('embarque_'));
    }
    return false;
  }

  /**
   * FIX ERROR 4 (3 embarques seguidos): máximo MAX_EMBARQUES_PER_AGENT embarques por turno.
   */
  function exceedsEmbarqueLimit(agentAssignedPositions, targetPosition) {
    if (!targetPosition.id.startsWith('embarque_')) return false;
    const currentEmbarques = agentAssignedPositions.filter(p => p.id.startsWith('embarque_')).length;
    return currentEmbarques >= MAX_EMBARQUES_PER_AGENT;
  }

  /**
   * REGLA: Agente en curso no puede ser asignado a posición que termine después de las 22:00.
   * Hora de salida especial para personal con curso.
   */
  function courseAgentExceedsSchedule(agentId, position, date) {
    if (!isAgentInCourse(agentId, date)) return false;
    const posEnd = parsePositionTime(position.time).end;
    return posEnd > 22 * 60; // 1320 min = 22:00 desde medianoche
  }

  /**
   * REGLA: Agente en observación solo puede ser asignado a mostradores economy/priority.
   * Durante el período de observación no entra en la rotación general.
   */
  function observacionRestricted(agentId, position, date) {
    if (!window.ROSTER || !window.ROSTER.isAgentInObservacion) return false;
    if (!window.ROSTER.isAgentInObservacion(agentId, date)) return false;
    const pid = position.id;
    return pid !== 'mostrador_econ' && !pid.startsWith('mostrador_prio');
  }

  /**
   * ¿El agente puede tomar la posición objetivo dado lo que ya tiene asignado?
   * Verifica: skill, disponibilidad, regla recibe↔embarque, límite embarques, conflicto horario.
   */
  function canAgentTakePosition(agent, targetPosition, agentAssignedPositions, date, agentHasBreak) {
    if (!canAgentBeAssigned(agent.id, date))             return false;
    if (agentHasBreak)                                   return false;
    if (!agentHasSkills(agent, targetPosition))          return false;
    if (violatesRecibeEmbarqueRule(agentAssignedPositions, targetPosition)) return false;
    if (exceedsEmbarqueLimit(agentAssignedPositions, targetPosition))       return false;
    // REGLA: Curso → salida máxima 22:00
    if (courseAgentExceedsSchedule(agent.id, targetPosition, date))        return false;
    // REGLA: Observación → solo mostradores economy/priority
    if (observacionRestricted(agent.id, targetPosition, date))             return false;
    // Verificar conflicto horario con cada posición ya asignada
    const noConflict = agentAssignedPositions.every(p => !positionsConflict(targetPosition, p));
    return noConflict;
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE DESCANSO
  // ═══════════════════════════════════════════════════════════════════

  /**
   * REGLA ABSOLUTA: Agente con embarque NO puede descansar durante la ventana del vuelo.
   * Este bloqueo no se supera con coberturas.
   * FIX ERROR 5/6 (descanso durante embarque): verificación explícita.
   */
  function isBoardingBlocked(agentAssignedPositions, breakSlot) {
    return agentAssignedPositions.some(p => {
      if (!p.id.startsWith('embarque_')) return false;
      return breakOverlapsPosition(breakSlot.start, p.time);
    });
  }

  /**
   * ¿El slot de descanso es compatible con todas las posiciones del agente?
   */
  function isBreakCompatible(agentAssignedPositions, breakSlot) {
    if (isBoardingBlocked(agentAssignedPositions, breakSlot)) return false;
    return agentAssignedPositions.every(p => {
      if (!p.critical) return true;
      return !breakOverlapsPosition(breakSlot.start, p.time);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE COBERTURA
  // ═══════════════════════════════════════════════════════════════════

  /**
   * FIX ERROR 3: Solo agentes con canWork=true o en curso ACTIVO (no unassigned)
   * pueden ser candidatos de cobertura.
   *
   * FIX ERROR 7 (Gate cubre Supervisor Control): Supervisor Gate SOLO cubre embarques.
   * FIX ERROR 8 (Supervisores no-Gate cubren embarques): Solo Gate puede cubrir embarques.
   */
  function canAgentCover(agent, position, date, agentAssignedPositions, agentBreakStart, coverageWindowStart, coverageWindowEnd, currentCoverageCount) {
    // No se puede cubrir si está en descanso de calendario (unassigned/R)
    if (!canAgentBeAssigned(agent.id, date)) return false;

    const isSup       = agent.type === 'supervisor';
    const isEmbarque  = position.id.startsWith('embarque_');
    const isGateAgent = _getGateAgentId() === agent.id;

    // REGLA: Gate solo cubre embarques
    if (isSup && isGateAgent && !isEmbarque) return false;
    // REGLA: Solo Gate cubre embarques entre supervisores
    if (isSup && !isGateAgent && isEmbarque) return false;

    // No cubrir la posición supervisor_gate (nunca se cubre)
    if (position.id === 'supervisor_gate') return false;

    // Límite de coberturas para tráfico
    if (!isSup && (currentCoverageCount || 0) >= MAX_COBERTURAS_TRAFFIC) return false;

    // El agente no puede estar en su propio descanso durante la ventana de cobertura.
    // agentBreakStart está en minutos-desde-15:00 (puede ser negativo en Verano MEX).
    // coverageWindowStart/End están en minutos-desde-medianoche.
    // → Convertir agentBreakStart a minutos-desde-medianoche antes de comparar.
    if (agentBreakStart !== undefined) {
      const agentBreakStartMdn = 900 + agentBreakStart; // 900 = 15:00 en min desde medianoche
      const agentBreakEndMdn   = agentBreakStartMdn + 60;
      if (timesOverlap(agentBreakStartMdn, agentBreakEndMdn, coverageWindowStart, coverageWindowEnd)) return false;
    }

    // REGLA REVISADA: Un agente puede cubrir SIEMPRE QUE no haya conflicto horario,
    // incluso si su propia posición es crítica.
    // La restricción anterior ("crítica bloquea todo") impedía cubrir mostradores vacíos.
    //
    // EXCEPCIÓN: Si el agente está en su PROPIO descanso durante la ventana → ya filtrado arriba.
    // EXCEPCIÓN: Si el agente está en embarque durante la ventana → bloqueo absoluto separado.
    //
    // Para posiciones de embarque: el agente candidato no puede tener embarque en la misma ventana.
    if (isEmbarque) {
      // Solo agentes sin posición crítica propia pueden cubrir embarques (el Gate ya fue manejado arriba)
      if (agentAssignedPositions.some(p => p.critical)) return false;
    }

    // Verificar que no hay solapamiento horario entre la ventana de cobertura y las posiciones propias
    const noConflict = agentAssignedPositions.every(p => {
      const pt = parsePositionTime(p.time);
      return !timesOverlap(pt.start, pt.end, coverageWindowStart, coverageWindowEnd);
    });
    if (!noConflict) return false;

    // Debe tener skills para la posición
    return agentHasSkills(agent, position);
  }

  // Variable interna para el ID del Supervisor Gate (se establece durante la asignación)
  let _gateAgentId = null;
  function _setGateAgentId(id) { _gateAgentId = id; }
  function _getGateAgentId()   { return _gateAgentId; }

  // ═══════════════════════════════════════════════════════════════════
  // REGLAS DE ROLES DE ABORDAJE (Titular / Bags)
  // FIX ERROR 9/10/11: un agente NO puede tener ambos roles simultáneamente
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Resuelve Titular y Bags para un embarque dado.
   * Garantiza que son agentes DISTINTOS.
   * Aplica rotación: quien tuvo el rol ayer va al final.
   */
  function resolveBoardingRoles(posId, assignedAgents, yesterdayRoles) {
    // yesterdayRoles = { titular: agentId|null, bags: agentId|null }
    const titAyer = yesterdayRoles?.titular || null;
    const bagAyer = yesterdayRoles?.bags    || null;

    // Candidatos a Titular: A2 >= MIN_BOARDING_ROLE_SKILL (0.75).
    // Fallback: si no hay con 0.75, acepta A2 >= 0.5 para no dejar el vuelo sin titular.
    const titSort = (a, b) => {
      if (a.id === titAyer && b.id !== titAyer) return 1;
      if (b.id === titAyer && a.id !== titAyer) return -1;
      return (b.skills.A2 || 0) - (a.skills.A2 || 0);
    };
    const titCand075 = assignedAgents.filter(a => (a.skills.A2 || 0) >= MIN_BOARDING_ROLE_SKILL).sort(titSort);
    const titCand050 = assignedAgents.filter(a => (a.skills.A2 || 0) >= 0.5).sort(titSort);
    const titularAgent = (titCand075.length > 0 ? titCand075 : titCand050)[0] || null;

    // Candidatos a Bags/Pendientes: A1 >= MIN_BOARDING_ROLE_SKILL, DISTINTO al Titular.
    // Fallback: si no hay con 0.75, acepta A1 >= 0.5.
    const bagSort = (a, b) => {
      if (a.id === bagAyer && b.id !== bagAyer) return 1;
      if (b.id === bagAyer && a.id !== bagAyer) return -1;
      return (b.skills.A1 || 0) - (a.skills.A1 || 0);
    };
    const bagCand075 = assignedAgents.filter(a => (a.skills.A1 || 0) >= MIN_BOARDING_ROLE_SKILL && a !== titularAgent).sort(bagSort);
    const bagCand050 = assignedAgents.filter(a => (a.skills.A1 || 0) >= 0.5 && a !== titularAgent).sort(bagSort);
    const bagAgent = (bagCand075.length > 0 ? bagCand075 : bagCand050)[0] || null;

    return { titularAgent, bagAgent };
  }

  // ═══════════════════════════════════════════════════════════════════
  // VALIDACIONES (tests de integridad)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Valida todas las reglas contra el estado actual de asignaciones.
   * Retorna array de { type: 'error'|'warning', msg: string }
   */
  function validate(assignments, breaks, coberturas, date, boardingRoles = {}) {
    const issues = [];
    const positions = getActivePositions(date);
    const allAgents = [
      ...(window.ROSTER.trafficAgents || []),
      ...(window.ROSTER.supervisorAgents || []),
    ];

    // Test 1: Mínimo 10 agentes disponibles
    const availableCount = allAgents.filter(a => canAgentBeAssigned(a.id, date)).length;
    if (availableCount < 10) {
      issues.push({ type: 'error', msg: `Solo ${availableCount} agentes disponibles (mínimo 10)` });
    }

    // Test 2: Posiciones críticas cubiertas
    positions.filter(p => p.critical && p.pool === 'traffic').forEach(pos => {
      const assigned = (assignments[pos.id] || []).filter(id => canAgentBeAssigned(id, date));
      if (assigned.length < pos.minAgents) {
        issues.push({ type: 'error', msg: `${pos.name}: ${assigned.length}/${pos.minAgents} agentes (crítica)` });
      }
    });

    // Test 3: Solo agentes asignables tienen posiciones
    Object.entries(assignments).forEach(([posId, ids]) => {
      ids.forEach(id => {
        if (!canAgentBeAssigned(id, date)) {
          const a = allAgents.find(x => x.id === id);
          issues.push({ type: 'error', msg: `${a?.name || id} no disponible pero tiene posición` });
        }
      });
    });

    // Test 4: Regla recibe↔embarque
    allAgents.forEach(agent => {
      const agentPos = positions.filter(p => (assignments[p.id] || []).includes(agent.id));
      const hasRecibe   = agentPos.some(p => p.id === 'recibe');
      const hasEmbarque = agentPos.some(p => p.id.startsWith('embarque_'));
      if (hasRecibe && hasEmbarque) {
        issues.push({ type: 'error', msg: `${agent.name}: tiene Recibe Y Embarque (regla exclusión)` });
      }
    });

    // Test 5: Límite de embarques por agente
    allAgents.forEach(agent => {
      const embarques = positions.filter(p => p.id.startsWith('embarque_') && (assignments[p.id] || []).includes(agent.id));
      if (embarques.length > MAX_EMBARQUES_PER_AGENT) {
        issues.push({ type: 'error', msg: `${agent.name}: ${embarques.length} embarques asignados (máx ${MAX_EMBARQUES_PER_AGENT})` });
      }
    });

    // Test 6: No descanso durante embarque
    allAgents.forEach(agent => {
      if (breaks[agent.id] === undefined) return;
      const slot = { start: breaks[agent.id] };
      const agentPos = positions.filter(p => (assignments[p.id] || []).includes(agent.id));
      if (isBoardingBlocked(agentPos, slot)) {
        issues.push({ type: 'error', msg: `${agent.name}: descanso durante ventana de embarque` });
      }
    });

    // Test 7: Agentes sin descanso (si debieran tenerlo)
    const needBreak = allAgents.filter(a => canAgentHaveBreak(a.id, date));
    const withoutBreak = needBreak.filter(a => breaks[a.id] === undefined);
    if (withoutBreak.length > 0) {
      issues.push({ type: 'warning', msg: `${withoutBreak.length} agente(s) sin descanso asignado` });
    }

    // Test 8: Coberturas inválidas (agente que cubre pero está en descanso de calendario)
    Object.entries(coberturas).forEach(([posId, cobList]) => {
      cobList.forEach(cob => {
        if (!canAgentBeAssigned(cob.agentId, date)) {
          const a = allAgents.find(x => x.id === cob.agentId);
          issues.push({ type: 'error', msg: `${a?.name || cob.agentId}: cubre pero no está disponible (descanso calendario)` });
        }
      });
    });

    // Test 9: Posición crítica con titular en descanso sin cobertura asignada
    Object.entries(assignments).forEach(([posId, agentIds]) => {
      const pos = positions.find(p => p.id === posId);
      if (!pos || !pos.critical) return;
      const slots = getActiveBreakSlots(date);
      agentIds.forEach(agentId => {
        if (breaks[agentId] === undefined) return;
        const sl = slots.find(s => s.start === breaks[agentId]);
        if (!sl || sl.blocked) return;
        if (!breakOverlapsPosition(sl.start, pos.time)) return;
        // Hay solapamiento: verificar que haya cobertura registrada
        const posCobs = coberturas[posId] || [];
        const covered = posCobs.some(c => c.titularId === agentId);
        if (!covered) {
          const a = allAgents.find(x => x.id === agentId);
          issues.push({ type: 'error', msg: `${pos.name}: ${a?.name || agentId} en descanso sin cobertura asignada` });
        }
      });
    });

    // Test: Roles de abordaje con skill insuficiente o sin asignar
    // ERROR si no hay titular/bags en absoluto o skill < 0.5.
    // WARNING si se usa fallback (0.5 ≤ skill < 0.75) por falta de personal con 0.75.
    Object.entries(boardingRoles).forEach(([posId, roles]) => {
      const pos = positions.find(p => p.id === posId);
      if (!pos) return;
      if (!roles.titular) {
        issues.push({ type: 'error', msg: `${pos.name}: sin Titular asignado (requiere A2 ≥ ${MIN_BOARDING_ROLE_SKILL})` });
      } else {
        const ag = allAgents.find(a => a.id === roles.titular);
        if (ag) {
          const skill = ag.skills.A2 || 0;
          if (skill < 0.5) {
            issues.push({ type: 'error', msg: `${ag.name}: Titular en ${pos.name} con A2 insuficiente (tiene ${skill}, mín 0.50)` });
          } else if (skill < MIN_BOARDING_ROLE_SKILL) {
            issues.push({ type: 'warning', msg: `${ag.name}: Titular en ${pos.name} con A2 de respaldo (tiene ${skill}, óptimo ${MIN_BOARDING_ROLE_SKILL})` });
          }
        }
      }
      if (!roles.bags) {
        issues.push({ type: 'error', msg: `${pos.name}: sin Bags/Pendientes asignado (requiere A1 ≥ ${MIN_BOARDING_ROLE_SKILL})` });
      } else {
        const ag = allAgents.find(a => a.id === roles.bags);
        if (ag) {
          const skill = ag.skills.A1 || 0;
          if (skill < 0.5) {
            issues.push({ type: 'error', msg: `${ag.name}: Bags en ${pos.name} con A1 insuficiente (tiene ${skill}, mín 0.50)` });
          } else if (skill < MIN_BOARDING_ROLE_SKILL) {
            issues.push({ type: 'warning', msg: `${ag.name}: Bags en ${pos.name} con A1 de respaldo (tiene ${skill}, óptimo ${MIN_BOARDING_ROLE_SKILL})` });
          }
        }
      }
    });

    return issues;
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPOSICIÓN PÚBLICA
  // ═══════════════════════════════════════════════════════════════════
  window.RULES = {
    // Constantes
    SCHEDULE,
    STORAGE,
    MAX_REPS_TRAFFIC,
    MAX_REPS_SUPERVISOR,
    MAX_REPS_RECIBE,
    MAX_EMBARQUES_PER_AGENT,
    MAX_COBERTURAS_TRAFFIC,
    MIN_BOARDING_ROLE_SKILL,
    POSITIONS_NORMAL,
    POSITIONS_VERANO_MEX,
    BREAK_SLOTS_NORMAL,
    BLOCKED_BREAK_WINDOWS,

    // Funciones de contexto
    setScheduleOverride,
    getScheduleOverride,
    isVeranoMEX,
    isAF179Filtered,
    getActivePositions,
    getActiveBreakSlots,

    // Utilidades de tiempo
    timeStrToMinutes,
    parsePositionTime,
    timesOverlap,
    positionsConflict,
    breakOverlapsPosition,

    // Elegibilidad
    isGamaWeekendBlocked,
    canAgentBeAssigned,
    canAgentHaveBreak,
    isAgentInCourse,
    agentHasSkills,

    // Reglas de posición
    violatesRecibeEmbarqueRule,
    exceedsEmbarqueLimit,
    courseAgentExceedsSchedule,
    observacionRestricted,
    canAgentTakePosition,

    // Reglas de descanso
    isBoardingBlocked,
    isBreakCompatible,

    // Reglas de cobertura
    canAgentCover,
    _setGateAgentId,
    _getGateAgentId,

    // Roles de abordaje
    resolveBoardingRoles,

    // Validación
    validate,
  };

})();
