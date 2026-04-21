/**
 * planner.js — Motor de asignación STBC · AF/KL MEX T1
 * Sistema de Todo Bajo Control (según) · Tlacuache Ops
 *
 * IMPORTANTE: Este archivo contiene SOLO lógica de asignación.
 * No toca el DOM. No renderiza nada.
 * Requiere: roster-data.js (window.ROSTER) + rules.js (window.RULES)
 *
 * Expone window.PLANNER con toda la API de asignación.
 */

(function () {
  'use strict';

  // Shortcuts
  const R = window.RULES;
  const ROSTER = window.ROSTER;

  // ═══════════════════════════════════════════════════════════════════
  // ESTADO MUTABLE DEL PLANIFICADOR
  // Se resetea por fecha. No comparte estado entre días.
  // ═══════════════════════════════════════════════════════════════════
  let _state = {
    date: null,
    assignments: {},   // { positionId: [agentId, ...] }
    breaks: {},        // { agentId: slotStart }
    coberturas: {},    // { positionId: [{ agentId, titularId, timeRange }] }
    boardingRoles: {}, // { positionId: { titular: agentId|null, bags: agentId|null } }
  };

  // ═══════════════════════════════════════════════════════════════════
  // UTILIDADES DE FECHA
  // ═══════════════════════════════════════════════════════════════════

  function localDateKey(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function dateMinusOneDay(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return d;
  }

  // ═══════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════

  function saveState() {
    const key = localDateKey(_state.date);
    try {
      localStorage.setItem(`${R.STORAGE.ASSIGNMENTS}_${key}`,  JSON.stringify(_state.assignments));
      localStorage.setItem(`${R.STORAGE.BREAKS}_${key}`,       JSON.stringify(_state.breaks));
      localStorage.setItem(`${R.STORAGE.COBERTURAS}_${key}`,   JSON.stringify(_state.coberturas));
      localStorage.setItem(`${R.STORAGE.BOARDING_ROLES}_${key}`, JSON.stringify(_state.boardingRoles));
    } catch (e) {
      console.warn('[PLANNER] Error guardando estado:', e);
    }
  }

  function loadState(date) {
    const key = localDateKey(date);
    try {
      const a  = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${key}`);
      const b  = localStorage.getItem(`${R.STORAGE.BREAKS}_${key}`);
      const c  = localStorage.getItem(`${R.STORAGE.COBERTURAS}_${key}`);
      const br = localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${key}`);
      _state.assignments  = a  ? JSON.parse(a)  : {};
      _state.breaks       = b  ? JSON.parse(b)  : {};
      _state.coberturas   = c  ? JSON.parse(c)  : {};
      _state.boardingRoles = br ? JSON.parse(br) : {};
    } catch (e) {
      _state.assignments  = {};
      _state.breaks       = {};
      _state.coberturas   = {};
      _state.boardingRoles = {};
    }

    // FIX ERROR 4: sanitización post-carga
    // Eliminar agentes que no son asignables en la fecha actual
    Object.keys(_state.assignments).forEach(posId => {
      _state.assignments[posId] = (_state.assignments[posId] || []).filter(id =>
        R.canAgentBeAssigned(id, date)
      );
    });
  }

  function clearState(date) {
    const key = localDateKey(date);
    [R.STORAGE.ASSIGNMENTS, R.STORAGE.BREAKS, R.STORAGE.COBERTURAS, R.STORAGE.BOARDING_ROLES].forEach(k => {
      localStorage.removeItem(`${k}_${key}`);
    });
    localStorage.removeItem(R.STORAGE.HISTORY);
    _state.assignments  = {};
    _state.breaks       = {};
    _state.coberturas   = {};
    _state.boardingRoles = {};
  }

  // ═══════════════════════════════════════════════════════════════════
  // HISTORIAL DE ROTACIÓN
  // ═══════════════════════════════════════════════════════════════════

  const historyManager = {
    get() {
      try {
        const s = localStorage.getItem(R.STORAGE.HISTORY);
        return s ? JSON.parse(s) : {};
      } catch { return {}; }
    },
    save(h) {
      try { localStorage.setItem(R.STORAGE.HISTORY, JSON.stringify(h)); } catch {}
    },
    record(agentId, positionId, date) {
      const h = this.get();
      if (!h[agentId]) h[agentId] = [];
      h[agentId].unshift({ positionId, date: localDateKey(date || _state.date), ts: Date.now() });
      if (h[agentId].length > 60) h[agentId] = h[agentId].slice(0, 60);
      this.save(h);
    },
    recordDescanso(agentId, date) {
      this.record(agentId, '__descanso__', date);
    },
    // Cuenta cuántos días consecutivos anteriores estuvo el agente en la posición,
    // leyendo los datos reales de localStorage por fecha.
    getConsecutiveDaysInPosition(agentId, positionId) {
      let count = 0;
      for (let daysBack = 1; daysBack <= 30; daysBack++) {
        const d = new Date(_state.date);
        d.setDate(d.getDate() - daysBack);
        const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(d)}`;
        try {
          const saved = localStorage.getItem(key);
          if (!saved) break;
          const savedAssignments = JSON.parse(saved);
          if ((savedAssignments[positionId] || []).includes(agentId)) {
            count++;
          } else {
            break;
          }
        } catch { break; }
      }
      return count;
    },
    getConsecutiveReps(agentId, positionId) {
      return this.getConsecutiveDaysInPosition(agentId, positionId);
    },
    getMaxReps(agentId, positionId) {
      if (positionId === 'recibe') return R.MAX_REPS_RECIBE;
      const all = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
      const a = all.find(x => x.id === agentId);
      return (a && a.type === 'supervisor') ? R.MAX_REPS_SUPERVISOR : R.MAX_REPS_TRAFFIC;
    },
    canAssign(agentId, positionId) {
      // Agentes en período de observación pueden repetir posición sin límite
      if (ROSTER.isAgentInObservacion && ROSTER.isAgentInObservacion(agentId, _state.date)) return true;
      return this.getConsecutiveDaysInPosition(agentId, positionId) < this.getMaxReps(agentId, positionId);
    },
  };

  // ═══════════════════════════════════════════════════════════════════
  // ROTACIÓN DE 'recibe' — lee historial real de localStorage
  // ═══════════════════════════════════════════════════════════════════

  function getRecibeRecentCounts() {
    const counts = {};
    for (let d = 1; d <= 14; d++) {
      const day = dateMinusOneDay(new Date(_state.date));
      day.setDate(day.getDate() - (d - 1));
      const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(day)}`;
      try {
        const saved = localStorage.getItem(key);
        if (!saved) continue;
        (JSON.parse(saved)['recibe'] || []).forEach(id => {
          counts[id] = (counts[id] || 0) + (15 - d);
        });
      } catch {}
    }
    return counts;
  }

  function didRecibeYesterday(agentId) {
    const yest = dateMinusOneDay(_state.date);
    try {
      const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`);
      if (!saved) return false;
      return (JSON.parse(saved)['recibe'] || []).includes(agentId);
    } catch { return false; }
  }

  function getPositionRecentCounts(posId) {
    const counts = {};
    for (let d = 1; d <= 14; d++) {
      const day = dateMinusOneDay(new Date(_state.date));
      day.setDate(day.getDate() - (d - 1));
      const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(day)}`;
      try {
        const saved = localStorage.getItem(key);
        if (!saved) continue;
        (JSON.parse(saved)[posId] || []).forEach(id => {
          counts[id] = (counts[id] || 0) + (15 - d);
        });
      } catch {}
    }
    return counts;
  }

  function wasInPositionYesterday(agentId, posId) {
    const yest = dateMinusOneDay(_state.date);
    try {
      const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`);
      if (!saved) return false;
      return (JSON.parse(saved)[posId] || []).includes(agentId);
    } catch { return false; }
  }

  function getBoardingRolesYesterday(posId) {
    const yest = dateMinusOneDay(_state.date);
    try {
      const saved = localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${localDateKey(yest)}`);
      if (!saved) return null;
      const roles = JSON.parse(saved);
      return roles[posId] || null;
    } catch { return null; }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HELPERS INTERNOS
  // ═══════════════════════════════════════════════════════════════════

  function getAgentAssignedPositions(agentId) {
    const active = R.getActivePositions(_state.date);
    return active.filter(p => (_state.assignments[p.id] || []).includes(agentId));
  }

  function agentHasBreak(agentId) {
    return _state.breaks[agentId] !== undefined;
  }

  function scoreAgent(agent, position) {
    const skillScore = position.skills.reduce((s, sk) => s + (agent.skills[sk] || 0), 0);
    const reps = historyManager.getConsecutiveReps(agent.id, position.id);
    const load = getAgentAssignedPositions(agent.id).length;
    return (skillScore * 100) - (reps * 50) - (load * 30);
  }

  function assignAgent(agent, position) {
    if (!_state.assignments[position.id]) _state.assignments[position.id] = [];
    _state.assignments[position.id].push(agent.id);
    historyManager.record(agent.id, position.id);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ASIGNACIÓN AUTOMÁTICA DE TRÁFICO
  // ═══════════════════════════════════════════════════════════════════

  function autoAssignTraffic() {
    const date = _state.date;
    const trafficAgents = (ROSTER.trafficAgents || []).filter(a => R.canAgentBeAssigned(a.id, date));
    const positions = R.getActivePositions(date).filter(p => p.pool === 'traffic');

    // Ordenar posiciones: embarques primero (prioridad 3), críticas (2), resto (1)
    const priority = p => p.id.startsWith('embarque_') ? 3 : p.critical ? 2 : 1;
    const sorted   = [...positions].sort((a, b) => priority(b) - priority(a));

    let assigned = 0;

    // ── Observación: asignar PRIMERO a agentes en período de observación ──
    // Garantiza que el agente en observación ocupe un mostrador antes que el resto.
    if (ROSTER.isAgentInObservacion) {
      const obsAgents = trafficAgents.filter(a => ROSTER.isAgentInObservacion(a.id, date));
      const mostradorIds = ['mostrador_econ', 'mostrador_prio1', 'mostrador_prio2', 'mostrador_prio3'];
      for (const agent of obsAgents) {
        for (const mId of mostradorIds) {
          const mPos = positions.find(p => p.id === mId);
          if (!mPos) continue;
          const current = (_state.assignments[mId] || []).filter(id => R.canAgentBeAssigned(id, date));
          if (current.length >= mPos.minAgents) continue;
          const agentPos = getAgentAssignedPositions(agent.id);
          if (!R.canAgentTakePosition(agent, mPos, agentPos, date, agentHasBreak(agent.id))) continue;
          assignAgent(agent, mPos);
          assigned++;
          break;
        }
      }
    }

    for (const pos of sorted) {
      const current  = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
      const needed   = pos.minAgents - current.length;
      if (needed <= 0) continue;

      // Pool de candidatos elegibles
      const qualified = trafficAgents.filter(a => {
        const agentPos = getAgentAssignedPositions(a.id);
        return R.canAgentTakePosition(a, pos, agentPos, date, agentHasBreak(a.id));
      });

      // Bypass de repetición si todos la han superado
      const someRepOk   = qualified.some(a => historyManager.canAssign(a.id, pos.id));
      const eligible    = someRepOk
        ? qualified.filter(a => historyManager.canAssign(a.id, pos.id))
        : qualified;

      if (eligible.length === 0) continue;

      // ── RECIBE: rotación dura por menor frecuencia, excluir quien lo hizo ayer ──
      if (pos.id === 'recibe') {
        const counts = getRecibeRecentCounts();
        const sinAyer = eligible.filter(a => !didRecibeYesterday(a.id));
        const pool    = sinAyer.length > 0 ? sinAyer : eligible;
        pool.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
        assignAgent(pool[0], pos);
        assigned++;
        continue;
      }

      // ── EMBARQUES: rotación dura + exclusión de quien estuvo ayer ──
      if (pos.id.startsWith('embarque_')) {
        const counts  = getPositionRecentCounts(pos.id);
        const sinAyer = eligible.filter(a => !wasInPositionYesterday(a.id, pos.id));
        const pool    = sinAyer.length >= needed ? sinAyer : eligible;
        pool.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
        const toAssign = pool.slice(0, needed);

        // Garantizar que haya al menos un agente con A1 >= MIN_BOARDING_ROLE_SKILL para el rol Bags
        if (pos.requiresBag) {
          const minSkill = R.MIN_BOARDING_ROLE_SKILL;
          const currentHasBag = current.some(id => {
            const ag = trafficAgents.find(x => x.id === id);
            return ag && (ag.skills.A1 || 0) >= minSkill;
          });
          if (!currentHasBag) {
            const newHasBag = toAssign.some(a => (a.skills.A1 || 0) >= minSkill);
            if (!newHasBag) {
              const bagCandidate = pool.find(a =>
                (a.skills.A1 || 0) >= minSkill && !toAssign.includes(a)
              );
              if (bagCandidate && toAssign.length > 0) {
                toAssign[toAssign.length - 1] = bagCandidate;
              }
            }
          }
        }

        toAssign.forEach(a => { assignAgent(a, pos); assigned++; });
        continue;
      }

      // ── RESTO DE POSICIONES: score-based ──
      const scored = eligible
        .map(a => ({ agent: a, score: scoreAgent(a, pos) }))
        .sort((a, b) => b.score - a.score);

      const toAssign = scored.slice(0, needed);
      toAssign.forEach(({ agent }) => { assignAgent(agent, pos); assigned++; });
    }

    // ── QUIOSCOS: llenar con excedentes (agentes sin posición asignada) ──
    const quioscoPos = positions.find(p => p.id === 'quiosco');
    if (quioscoPos) {
      const assignedSet   = new Set(Object.values(_state.assignments).flat());
      const quioscoActual = (_state.assignments['quiosco'] || []).length;
      const maxAgents     = quioscoPos.maxAgents || 5;
      const slotsLibres   = maxAgents - quioscoActual;

      if (slotsLibres > 0) {
        const excedentes = trafficAgents.filter(a =>
          !assignedSet.has(a.id) &&
          R.agentHasSkills(a, quioscoPos) &&
          !agentHasBreak(a.id)
        );
        excedentes.slice(0, slotsLibres).forEach(a => { assignAgent(a, quioscoPos); assigned++; });
      }
    }

    return assigned;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ASIGNACIÓN AUTOMÁTICA DE SUPERVISORES
  // ═══════════════════════════════════════════════════════════════════

  function autoAssignSupervisors() {
    const date = _state.date;
    let available = (ROSTER.supervisorAgents || []).filter(s =>
      R.canAgentBeAssigned(s.id, date) &&
      !Object.values(_state.assignments).flat().includes(s.id) &&
      !agentHasBreak(s.id)
    );

    const supPositions = R.getActivePositions(date).filter(p => p.pool === 'supervisor');
    let assigned = 0;

    for (const pos of supPositions) {
      const current = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
      if (current.length >= pos.minAgents) continue;

      const qualified = available.filter(s => R.agentHasSkills(s, pos));
      const someRepOk = qualified.some(s => historyManager.canAssign(s.id, pos.id));
      const eligible  = someRepOk
        ? qualified.filter(s => historyManager.canAssign(s.id, pos.id))
        : qualified;

      if (eligible.length === 0) continue;

      // Fisher-Yates shuffle + ordenar por menor repetición
      for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
      }
      eligible.sort((a, b) =>
        historyManager.getConsecutiveReps(a.id, pos.id) -
        historyManager.getConsecutiveReps(b.id, pos.id)
      );

      const sup = eligible[0];
      assignAgent(sup, pos);

      // Registrar quién es Gate (para coberturas)
      if (pos.id === 'supervisor_gate') R._setGateAgentId(sup.id);

      available = available.filter(s => s.id !== sup.id);
      assigned++;
    }

    return assigned;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ASIGNACIÓN AUTOMÁTICA DE DESCANSOS
  // ═══════════════════════════════════════════════════════════════════

  function autoAssignBreaks() {
    const date     = _state.date;
    const allAgents = [
      ...(ROSTER.trafficAgents   || []),
      ...(ROSTER.supervisorAgents || []),
    ].filter(a => R.canAgentHaveBreak(a.id, date));

    let needBreak = allAgents.filter(a => _state.breaks[a.id] === undefined);
    if (needBreak.length === 0) return 0;

    // Obtener slots activos (copia mutable con conteo actual)
    const rawSlots = R.getActiveBreakSlots(date);
    let slots = rawSlots.filter(s => !s.blocked).map(s => ({
      ...s,
      current: Object.values(_state.breaks).filter(t => t === s.start).length,
    }));

    // Ajuste dinámico de capacidad si es necesario
    const totalCap = slots.reduce((sum, s) => sum + s.max, 0);
    if (needBreak.length > totalCap) {
      const deficit = needBreak.length - totalCap;
      const inc = Math.ceil(deficit / slots.length);
      slots.forEach(s => { s.max += inc; });
    }

    const newBreaks = { ...(_state.breaks) };
    let assigned = 0;
    const unassigned = [];

    // Mejor slot disponible (menor ocupación porcentual)
    const bestSlot = (filterFn) =>
      slots.filter(s => s.current < s.max && (!filterFn || filterFn(s)))
           .sort((a, b) => (a.current / a.max) - (b.current / b.max))[0];

    const chronoSlot = () =>
      slots.filter(s => s.current < s.max).sort((a, b) => a.start - b.start)[0];

    // ── Prioridad 1: agente de Recibe → primer slot cronológico ──
    const recibeId = (_state.assignments['recibe'] || [])[0];
    if (recibeId && !newBreaks[recibeId]) {
      const sl = chronoSlot();
      if (sl) {
        newBreaks[recibeId] = sl.start;
        sl.current++;
        assigned++;
      }
      needBreak = needBreak.filter(a => a.id !== recibeId);
    }

    // ── Prioridad 2: Supervisor Gate → slot fuera de ventanas de vuelo ──
    const isFlightWindow = (slotStart) => {
      const se = slotStart + 60;
      return R.BLOCKED_BREAK_WINDOWS.some(w => slotStart < w.end && se > w.start);
    };
    const gateId = (_state.assignments['supervisor_gate'] || [])[0];
    if (gateId && !newBreaks[gateId]) {
      const sl = bestSlot(s => !isFlightWindow(s.start));
      if (sl) {
        newBreaks[gateId] = sl.start;
        sl.current++;
        assigned++;
      }
      needBreak = needBreak.filter(a => a.id !== gateId);
    }

    // ── Paso 1: agentes sin posiciones asignadas ──
    const withoutPos = needBreak.filter(a => getAgentAssignedPositions(a.id).length === 0);
    withoutPos.forEach(agent => {
      const sl = bestSlot();
      if (sl) {
        newBreaks[agent.id] = sl.start;
        sl.current++;
        assigned++;
      }
    });
    needBreak = needBreak.filter(a => !newBreaks[a.id]);

    // ── Paso 2: agentes con posiciones (no críticas primero, luego críticas) ──
    const withNonCritical = needBreak.filter(a =>
      getAgentAssignedPositions(a.id).every(p => !p.critical)
    );
    const withCritical = needBreak.filter(a =>
      getAgentAssignedPositions(a.id).some(p => p.critical)
    );

    // Helper: comprueba si existe al menos un candidato de cobertura para todas las
    // posiciones críticas del agente que se solaparían con el slot de descanso dado.
    // Si alguna posición crítica no tiene candidato, el slot es inválido para ese agente.
    function hasCoverageForCritical(agent, sl) {
      const agentPos = getAgentAssignedPositions(agent.id);
      const criticalOverlapping = agentPos.filter(pos =>
        pos.critical && R.breakOverlapsPosition(sl.start, pos.time)
      );
      if (criticalOverlapping.length === 0) return true; // no hay posición crítica solapada

      const cvStart = 900 + sl.start;
      const cvEnd   = cvStart + 60;
      const allAgents = [
        ...(ROSTER.trafficAgents   || []),
        ...(ROSTER.supervisorAgents || []),
      ];

      return criticalOverlapping.every(pos => {
        const hasCover = allAgents.some(a => {
          if (a.id === agent.id) return false;
          if (!R.canAgentBeAssigned(a.id, date)) return false;
          const agPos   = getAgentAssignedPositions(a.id);
          const agBreak = newBreaks[a.id]; // usar newBreaks (estado en construcción)
          return R.canAgentCover(a, pos, date, agPos, agBreak, cvStart, cvEnd, 0);
        });
        return hasCover;
      });
    }

    for (const agent of [...withNonCritical, ...withCritical]) {
      const agentPos = getAgentAssignedPositions(agent.id);
      const hasCritical = agentPos.some(p => p.critical);
      const sortedSlots = slots.filter(s => s.current < s.max).sort((a, b) => (a.current / a.max) - (b.current / b.max));
      let done = false;

      for (const sl of sortedSlots) {
        // BLOQUEO ABSOLUTO: embarque → no hay cobertura que lo supere
        if (R.isBoardingBlocked(agentPos, sl)) continue;

        if (!R.isBreakCompatible(agentPos, sl)) {
          // El agente tiene posición crítica solapada → solo asignar si hay cobertura disponible
          if (!hasCritical) continue; // posición no-crítica sin compatibilidad → saltar
          if (!hasCoverageForCritical(agent, sl)) continue; // no hay candidato de cobertura → saltar slot
        }

        newBreaks[agent.id] = sl.start;
        sl.current++;
        assigned++;
        done = true;
        break;
      }

      if (!done) unassigned.push(agent);
    }

    // ── Paso 3: último recurso — forzar slot ignorando capacidad máxima ──
    // Aun en último recurso, no dejar posición crítica sin cobertura.
    for (const agent of unassigned) {
      const agentPos    = getAgentAssignedPositions(agent.id);
      const hasCritical = agentPos.some(p => p.critical);
      let done = false;

      for (const sl of slots) {
        if (sl.blocked) continue;
        if (R.isBoardingBlocked(agentPos, sl)) continue;
        if (hasCritical && !hasCoverageForCritical(agent, sl)) continue;
        newBreaks[agent.id] = sl.start;
        sl.current++;
        assigned++;
        done = true;
        break;
      }

      // Último recurso absoluto: si realmente no hay cobertura posible en ningún slot,
      // asignar al slot menos ocupado disponible y emitir advertencia implícita en validate()
      if (!done) {
        const fallback = slots.filter(s => !s.blocked && !R.isBoardingBlocked(agentPos, s))
                              .sort((a, b) => a.current - b.current)[0];
        if (fallback) {
          newBreaks[agent.id] = fallback.start;
          fallback.current++;
          assigned++;
        }
      }
    }

    // Guardar los breaks previos para comparar (antes de asignar newBreaks)
    const breaksAntes = { ...(_state.breaks) };
    _state.breaks = newBreaks;

    // Registrar '__descanso__' SOLO a agentes que recibieron break en esta ejecución,
    // no a los que ya tenían break cargado de localStorage.
    // Esto evita corromper el historial de rotación de posiciones.
    Object.keys(newBreaks).forEach(id => {
      if (breaksAntes[id] === undefined) {
        historyManager.recordDescanso(id);
      }
    });
    return assigned;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ASIGNACIÓN AUTOMÁTICA DE COBERTURAS
  // FIX ERRORES 3,6,7,8,12: coberturas correctamente filtradas
  // ═══════════════════════════════════════════════════════════════════

  function autoAssignCoberturas() {
    const date      = _state.date;
    const positions = R.getActivePositions(date);
    const allAgents = [
      ...(ROSTER.trafficAgents   || []),
      ...(ROSTER.supervisorAgents || []),
    ];
    const assignedSet = new Set(Object.values(_state.assignments).flat());
    _state.coberturas = {};

    // Mapa de carga: cuántas coberturas tiene cada agente ya asignado
    const coverageLoad = {};
    let total = 0;

    Object.entries(_state.assignments).forEach(([posId, agentIds]) => {
      const pos = positions.find(p => p.id === posId);
      if (!pos) return;

      agentIds.forEach(agentId => {
        if (_state.breaks[agentId] === undefined) return;
        const sl = R.getActiveBreakSlots(date).find(s => s.start === _state.breaks[agentId]);
        if (!sl) return;
        if (!R.breakOverlapsPosition(sl.start, pos.time)) return;

        // FIX ERROR 7/8/9: supervisor_gate no se cubre; Gate solo cubre embarques
        if (pos.id === 'supervisor_gate') return;

        // Ventana de cobertura = el slot de descanso del titular
        const cvStart = 900 + sl.start; // minutos desde medianoche
        const cvEnd   = cvStart + 60;

        const candidates = allAgents
          .filter(a => {
            if (a.id === agentId) return false;
            const agPos = getAgentAssignedPositions(a.id);
            const agBreak = _state.breaks[a.id];

            // FIX ERROR 3: solo agentes disponibles según calendario
            return R.canAgentCover(
              a, pos, date,
              agPos,
              agBreak,
              cvStart, cvEnd,
              coverageLoad[a.id] || 0
            );
          })
          .sort((a, b) => {
            const la = coverageLoad[a.id] || 0;
            const lb = coverageLoad[b.id] || 0;
            // Supervisores van al final (excepto Gate en embarques)
            const catA = (a.type === 'supervisor' ? 20 : 0) + la;
            const catB = (b.type === 'supervisor' ? 20 : 0) + lb;
            return catA - catB;
          });

        if (candidates.length === 0) return;

        // FIX ERROR 6/12: verificar que el candidato NO ya tiene cobertura en la misma ventana
        const candidate = candidates.find(a => {
          const yaAsignadas = Object.values(_state.coberturas).flat().filter(c => c.agentId === a.id);
          return !yaAsignadas.some(c => {
            const [cs, ce] = c.timeRange.split('-');
            const csMin = R.timeStrToMinutes(cs);
            const ceMin = R.timeStrToMinutes(ce);
            return R.timesOverlap(csMin, ceMin, cvStart, cvEnd);
          });
        });

        if (!candidate) return;

        if (!_state.coberturas[posId]) _state.coberturas[posId] = [];
        _state.coberturas[posId].push({
          agentId:   candidate.id,
          titularId: agentId,
          timeRange: sl.time,
        });
        coverageLoad[candidate.id] = (coverageLoad[candidate.id] || 0) + 1;
        total++;
      });
    });

    return total;
  }

  // ═══════════════════════════════════════════════════════════════════
  // ROLES DE ABORDAJE
  // FIX ERRORES 9/10/11: Titular ≠ Bags garantizado
  // ═══════════════════════════════════════════════════════════════════

  function resolveBoardingRolesAll() {
    const allAgents = [
      ...(ROSTER.trafficAgents   || []),
      ...(ROSTER.supervisorAgents || []),
    ];
    const embarqueIds = ['embarque_af179', 'embarque_kl686', 'embarque_af173'];

    embarqueIds.forEach(posId => {
      const ids = _state.assignments[posId] || [];
      if (ids.length === 0) return;
      const agents = ids.map(id => allAgents.find(a => a.id === id)).filter(Boolean);
      const yesterday = getBoardingRolesYesterday(posId);
      const { titularAgent, bagAgent } = R.resolveBoardingRoles(posId, agents, yesterday);
      _state.boardingRoles[posId] = {
        titular: titularAgent?.id || null,
        bags:    bagAgent?.id    || null,
      };
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // API PÚBLICA DEL PLANIFICADOR
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Inicializa el planificador para una fecha dada.
   * Carga estado persistido y actualiza el contexto de Gate.
   */
  function init(date) {
    _state.date = date;
    loadState(date);

    // Restaurar Gate ID desde estado cargado
    const gateId = (_state.assignments['supervisor_gate'] || [])[0];
    if (gateId) R._setGateAgentId(gateId);
    else R._setGateAgentId(null);
  }

  /**
   * Ejecuta la asignación automática completa en el orden correcto.
   * Retorna resumen de lo asignado.
   */
  function autoAssignAll() {
    const t = autoAssignTraffic();
    const s = autoAssignSupervisors();
    const b = autoAssignBreaks();
    resolveBoardingRolesAll();
    const c = autoAssignCoberturas();
    saveState();
    return { traffic: t, supervisors: s, breaks: b, coberturas: c };
  }

  /**
   * Asigna manualmente un agente a una posición.
   * Valida todas las reglas antes de asignar.
   * Retorna { ok: boolean, error?: string }
   */
  function manualAssign(agentId, positionId) {
    const date      = _state.date;
    const positions = R.getActivePositions(date);
    const pos       = positions.find(p => p.id === positionId);
    if (!pos) return { ok: false, error: 'Posición no encontrada' };

    const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
    const agent     = allAgents.find(a => a.id === agentId);
    if (!agent) return { ok: false, error: 'Agente no encontrado' };

    const agentPos  = getAgentAssignedPositions(agentId);
    const hasBreak  = agentHasBreak(agentId);

    if (!R.canAgentTakePosition(agent, pos, agentPos, date, hasBreak)) {
      if (!R.canAgentBeAssigned(agentId, date)) return { ok: false, error: 'Agente no disponible este día' };
      if (hasBreak) return { ok: false, error: 'Agente tiene descanso asignado' };
      if (!R.agentHasSkills(agent, pos)) return { ok: false, error: 'Agente no tiene los skills requeridos' };
      if (R.violatesRecibeEmbarqueRule(agentPos, pos)) return { ok: false, error: 'Regla: Recibe ↔ Embarque son excluyentes' };
      if (R.exceedsEmbarqueLimit(agentPos, pos)) return { ok: false, error: `Máximo ${R.MAX_EMBARQUES_PER_AGENT} embarques por agente` };
      return { ok: false, error: 'Conflicto de horario con posición actual' };
    }

    assignAgent(agent, pos);
    if (pos.id === 'supervisor_gate') R._setGateAgentId(agentId);
    resolveBoardingRolesAll();
    saveState();
    return { ok: true };
  }

  /**
   * Quita manualmente un agente de una posición.
   */
  function manualUnassign(agentId, positionId) {
    if (!_state.assignments[positionId]) return;
    _state.assignments[positionId] = _state.assignments[positionId].filter(id => id !== agentId);
    if (positionId === 'supervisor_gate' && R._getGateAgentId() === agentId) {
      R._setGateAgentId(null);
    }
    resolveBoardingRolesAll();
    saveState();
  }

  /**
   * Asigna manualmente un descanso a un agente.
   * Valida bloqueo de embarque.
   * Retorna { ok: boolean, error?: string }
   */
  function manualSetBreak(agentId, slotStart) {
    const date     = _state.date;
    const slots    = R.getActiveBreakSlots(date);
    const slot     = slots.find(s => s.start === slotStart);
    const agentPos = getAgentAssignedPositions(agentId);

    if (!R.canAgentHaveBreak(agentId, date)) {
      return { ok: false, error: 'Agente en curso o no disponible' };
    }
    if (slot && slot.blocked) {
      return { ok: false, error: 'Slot bloqueado (ventana de embarque)' };
    }
    if (R.isBoardingBlocked(agentPos, { start: slotStart })) {
      return { ok: false, error: 'El agente está en abordaje durante ese slot' };
    }
    _state.breaks[agentId] = slotStart;
    saveState();
    return { ok: true };
  }

  /**
   * Quita el descanso de un agente.
   */
  function manualClearBreak(agentId) {
    delete _state.breaks[agentId];
    // Quitar coberturas donde este agente es titular
    Object.keys(_state.coberturas).forEach(posId => {
      _state.coberturas[posId] = (_state.coberturas[posId] || []).filter(c => c.titularId !== agentId);
    });
    saveState();
  }

  /**
   * Retorna el estado completo actual (solo lectura).
   */
  function getState() {
    return {
      date:         _state.date,
      assignments:  { ..._state.assignments },
      breaks:       { ..._state.breaks },
      coberturas:   { ..._state.coberturas },
      boardingRoles:{ ..._state.boardingRoles },
    };
  }

  /**
   * Retorna info completa de un agente para la fecha actual:
   * posiciones, descanso, coberturas, rol de abordaje, estado.
   */
  function getAgentInfo(agentId) {
    const date = _state.date;
    const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
    const agent = allAgents.find(a => a.id === agentId);
    if (!agent) return null;

    const status   = ROSTER.getAgentStatus(agentId, date);
    const positions = getAgentAssignedPositions(agentId);
    const breakSlotStart = _state.breaks[agentId];
    const slots = R.getActiveBreakSlots(date);
    const breakSlot = breakSlotStart !== undefined ? slots.find(s => s.start === breakSlotStart) : null;

    // Coberturas donde este agente cubre a otros
    const asCoverage = Object.entries(_state.coberturas)
      .flatMap(([posId, list]) => list
        .filter(c => c.agentId === agentId)
        .map(c => {
          const pos = R.getActivePositions(date).find(p => p.id === posId);
          return { position: pos, titularId: c.titularId, timeRange: c.timeRange };
        })
      );

    // Rol en embarques
    const boardingRole = {};
    Object.entries(_state.boardingRoles).forEach(([posId, roles]) => {
      if (roles.titular === agentId) boardingRole[posId] = 'titular';
      else if (roles.bags === agentId) boardingRole[posId] = 'bags';
    });

    const inCourse = R.isAgentInCourse(agentId, date);

    return {
      agent,
      status,
      inCourse,
      canWork: R.canAgentBeAssigned(agentId, date),
      positions,
      breakSlot,
      asCoverage,
      boardingRole,
    };
  }

  /**
   * Planea un mes completo ejecutando autoAssignAll para cada día del mes.
   * year: número de año (ej. 2026), month: número de mes 1-12.
   * options.overwrite (default true): si false, omite días que ya tienen asignaciones.
   * options.progressCb(day, total, status): callback opcional de progreso.
   * Retorna { days, skipped, errors }.
   */
  function planMonth(year, month, options = {}) {
    const { overwrite = true, progressCb = null, startDay = 1 } = options;
    const daysInMonth = new Date(year, month, 0).getDate();
    const summary = { days: 0, skipped: 0, errors: [] };

    for (let day = startDay; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(date)}`;

      if (!overwrite && localStorage.getItem(key)) {
        summary.skipped++;
        if (progressCb) progressCb(day, daysInMonth, 'skipped');
        continue;
      }

      try {
        _state.date       = date;
        _state.assignments  = {};
        _state.breaks       = {};
        _state.coberturas   = {};
        _state.boardingRoles = {};
        autoAssignAll();
        summary.days++;
      } catch (e) {
        summary.errors.push({ day, error: e.message });
      }

      if (progressCb) progressCb(day, daysInMonth, 'done');
    }

    // Restaurar el planificador al último día procesado para que la UI no quede en estado raro
    init(_state.date);
    return summary;
  }

  /**
   * Valida el estado actual y retorna array de issues.
   */
  function validate() {
    return R.validate(_state.assignments, _state.breaks, _state.coberturas, _state.date, _state.boardingRoles);
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPORTAR / IMPORTAR / RECALCULAR PARCIAL
  // Permite guardar el estado planificado, cargarlo y actualizar
  // solo las posiciones vacías sin mover al personal ya asignado.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Exporta el estado de un día a JSON descargable.
   * Si no se provee date, usa la fecha activa.
   */
  function exportDayState(date) {
    const key = localDateKey(date || _state.date);
    const state = {
      version: '1.0',
      type: 'day',
      date: key,
      assignments:  JSON.parse(localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${key}`)  || '{}'),
      breaks:       JSON.parse(localStorage.getItem(`${R.STORAGE.BREAKS}_${key}`)       || '{}'),
      coberturas:   JSON.parse(localStorage.getItem(`${R.STORAGE.COBERTURAS}_${key}`)   || '{}'),
      boardingRoles:JSON.parse(localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${key}`) || '{}'),
    };
    return JSON.stringify(state, null, 2);
  }

  /**
   * Exporta el estado de todos los días planificados de un mes a JSON.
   * year: número de año, month: número de mes 1-12.
   */
  function exportMonthState(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const key = localDateKey(d);
      const a = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${key}`);
      if (!a) continue;
      days[key] = {
        assignments:  JSON.parse(a || '{}'),
        breaks:       JSON.parse(localStorage.getItem(`${R.STORAGE.BREAKS}_${key}`)        || '{}'),
        coberturas:   JSON.parse(localStorage.getItem(`${R.STORAGE.COBERTURAS}_${key}`)    || '{}'),
        boardingRoles:JSON.parse(localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${key}`) || '{}'),
      };
    }
    return JSON.stringify({ version: '1.0', type: 'month', year, month, days }, null, 2);
  }

  /**
   * Importa estado de un día desde JSON.
   * Sanitiza los agentes ya no disponibles del estado cargado.
   * Si targetDate se provee, sobreescribe la fecha del archivo.
   */
  function importDayState(json, targetDate) {
    let data;
    try { data = JSON.parse(json); } catch (e) { throw new Error('JSON inválido: ' + e.message); }

    const useDate = targetDate || (() => {
      const [y, m, d] = (data.date || '').split('-').map(Number);
      return (y && m && d) ? new Date(y, m - 1, d) : _state.date;
    })();

    _state.date         = useDate;
    _state.assignments  = data.assignments  || {};
    _state.breaks       = data.breaks       || {};
    _state.coberturas   = data.coberturas   || {};
    _state.boardingRoles = data.boardingRoles || {};

    // Sanitizar agentes que ya no están disponibles
    Object.keys(_state.assignments).forEach(posId => {
      _state.assignments[posId] = (_state.assignments[posId] || []).filter(id =>
        R.canAgentBeAssigned(id, useDate)
      );
    });

    const gateId = (_state.assignments['supervisor_gate'] || [])[0];
    if (gateId) R._setGateAgentId(gateId); else R._setGateAgentId(null);

    saveState();
    return true;
  }

  /**
   * Importa el estado de un mes completo desde JSON.
   * Sanitiza agentes no disponibles en cada día.
   * Retorna { imported: número de días cargados }.
   */
  function importMonthState(json) {
    let data;
    try { data = JSON.parse(json); } catch (e) { throw new Error('JSON inválido: ' + e.message); }
    if (data.type !== 'month') throw new Error('El archivo no contiene un estado mensual');

    let imported = 0;
    Object.entries(data.days || {}).forEach(([key, dayData]) => {
      const [y, m, d] = key.split('-').map(Number);
      if (!y || !m || !d) return;
      const date = new Date(y, m - 1, d);

      const assignments = { ...(dayData.assignments || {}) };
      Object.keys(assignments).forEach(posId => {
        assignments[posId] = (assignments[posId] || []).filter(id =>
          R.canAgentBeAssigned(id, date)
        );
      });

      try {
        localStorage.setItem(`${R.STORAGE.ASSIGNMENTS}_${key}`,   JSON.stringify(assignments));
        localStorage.setItem(`${R.STORAGE.BREAKS}_${key}`,        JSON.stringify(dayData.breaks || {}));
        localStorage.setItem(`${R.STORAGE.COBERTURAS}_${key}`,    JSON.stringify(dayData.coberturas || {}));
        localStorage.setItem(`${R.STORAGE.BOARDING_ROLES}_${key}`,JSON.stringify(dayData.boardingRoles || {}));
        imported++;
      } catch (e) { console.warn('[PLANNER] Error importando día', key, e); }
    });
    return { imported };
  }

  /**
   * Recalcula parcialmente el día activo (o el provisto).
   * Mantiene todas las asignaciones válidas existentes y solo llena los huecos.
   * Útil tras altas/bajas de personal para actualizar sin reasignar a todos.
   */
  function recalculatePartial(date) {
    if (date) _state.date = date;
    // loadState sanitiza agentes no disponibles y deja intactos los válidos
    loadState(_state.date);
    const gateId = (_state.assignments['supervisor_gate'] || [])[0];
    if (gateId) R._setGateAgentId(gateId); else R._setGateAgentId(null);
    // autoAssignAll solo llena posiciones con hueco (current.length < minAgents)
    return autoAssignAll();
  }

  /**
   * Estadísticas de disponibilidad para la fecha actual.
   */
  function getStats() {
    const date = _state.date;
    const positions = R.getActivePositions(date);
    const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];

    const enServicio  = allAgents.filter(a => R.canAgentBeAssigned(a.id, date)).length;
    const enCurso     = allAgents.filter(a => R.isAgentInCourse(a.id, date)).length;
    const descanso    = allAgents.filter(a => {
      const st = ROSTER.getAgentStatus(a.id, date);
      return st.status === 'descanso';
    }).length;

    const criticalCovered = positions.filter(p => p.critical && p.pool === 'traffic').every(pos => {
      const assigned = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
      return assigned.length >= pos.minAgents;
    });

    const agentsWithBreak = allAgents.filter(a => R.canAgentHaveBreak(a.id, date));
    const breakCoverage   = agentsWithBreak.length > 0
      ? agentsWithBreak.filter(a => _state.breaks[a.id] !== undefined).length
      : 0;

    return {
      total: allAgents.length,
      enServicio,
      enCurso,
      descanso,
      criticalCovered,
      breakCoverage,
      breakTotal: agentsWithBreak.length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPOSICIÓN PÚBLICA
  // ═══════════════════════════════════════════════════════════════════
  window.PLANNER = {
    init,
    autoAssignAll,
    planMonth,
    autoAssignTraffic,
    autoAssignSupervisors,
    autoAssignBreaks,
    autoAssignCoberturas,
    resolveBoardingRolesAll,
    manualAssign,
    manualUnassign,
    manualSetBreak,
    manualClearBreak,
    getState,
    getAgentInfo,
    validate,
    getStats,
    clearState,
    saveState,
    localDateKey,
    exportDayState,
    exportMonthState,
    importDayState,
    importMonthState,
    recalculatePartial,
  };

})();
