/**
planner.js — Motor de asignación STBC · AF/KL MEX T1
Sistema de Todo Bajo Control (según) · Tlacuache Ops
IMPORTANTE: Este archivo contiene SOLO lógica de asignación.
No toca el DOM. No renderiza nada.
Requiere: roster-data.js (window.ROSTER) + rules.js (window.RULES)
Expone window.PLANNER con toda la API de asignación.
*/
(function () {
'use strict';
const R = window.RULES;
const ROSTER = window.ROSTER;

let _state = {
  date: null,
  assignments: {},
  breaks: {},
  coberturas: {},
  boardingRoles: {},
  sombras: {},    // { posId: [agentId, ...] } — observadores en modo 'sombra', no ocupan slot
};

let _ruleLog = [];

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

function saveState() {
  const key = localDateKey(_state.date);
  try {
    localStorage.setItem(`${R.STORAGE.ASSIGNMENTS}_${key}`, JSON.stringify(_state.assignments));
    localStorage.setItem(`${R.STORAGE.BREAKS}_${key}`, JSON.stringify(_state.breaks));
    localStorage.setItem(`${R.STORAGE.COBERTURAS}_${key}`, JSON.stringify(_state.coberturas));
    localStorage.setItem(`${R.STORAGE.BOARDING_ROLES}_${key}`, JSON.stringify(_state.boardingRoles));
    localStorage.setItem(`${R.STORAGE.SOMBRAS}_${key}`, JSON.stringify(_state.sombras || {}));
  } catch (e) { console.warn('[PLANNER] Error guardando estado:', e); }
}

function saveRuleLog() {
  const key = localDateKey(_state.date);
  try { localStorage.setItem(`wfm_rule_log_${key}`, JSON.stringify(_ruleLog.slice(0, 500))); } catch {}
}

function loadRuleLog(date) {
  const key = localDateKey(date);
  try {
    const s = localStorage.getItem(`wfm_rule_log_${key}`);
    _ruleLog = s ? JSON.parse(s) : [];
  } catch { _ruleLog = []; }
}

function logRuleViolation(entry) {
  _ruleLog.unshift({ ...entry, date: localDateKey(_state.date), ts: Date.now() });
  if (_ruleLog.length > 500) _ruleLog = _ruleLog.slice(0, 500);
  saveRuleLog();
}

function loadState(date) {
  const key = localDateKey(date);
  try {
    const a = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${key}`);
    const b = localStorage.getItem(`${R.STORAGE.BREAKS}_${key}`);
    const c = localStorage.getItem(`${R.STORAGE.COBERTURAS}_${key}`);
    const br = localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${key}`);
    const sm = localStorage.getItem(`${R.STORAGE.SOMBRAS}_${key}`);
    _state.assignments = a ? JSON.parse(a) : {};
    _state.breaks = b ? JSON.parse(b) : {};
    _state.coberturas = c ? JSON.parse(c) : {};
    _state.boardingRoles = br ? JSON.parse(br) : {};
    _state.sombras = sm ? JSON.parse(sm) : {};
  } catch (e) {
    _state.assignments = {}; _state.breaks = {}; _state.coberturas = {}; _state.boardingRoles = {}; _state.sombras = {};
  }
  Object.keys(_state.assignments).forEach(posId => {
    _state.assignments[posId] = (_state.assignments[posId] || []).filter(id => R.canAgentBeAssigned(id, date));
  });
}

function clearState(date) {
  const key = localDateKey(date);
  [R.STORAGE.ASSIGNMENTS, R.STORAGE.BREAKS, R.STORAGE.COBERTURAS, R.STORAGE.BOARDING_ROLES, R.STORAGE.SOMBRAS].forEach(k => {
    localStorage.removeItem(`${k}_${key}`);
  });
  localStorage.removeItem(`wfm_rule_log_${key}`);
  _state.assignments = {}; _state.breaks = {}; _state.coberturas = {}; _state.boardingRoles = {}; _state.sombras = {};
  _ruleLog = [];
}

const historyManager = {
  get() { try { const s = localStorage.getItem(R.STORAGE.HISTORY); return s ? JSON.parse(s) : {}; } catch { return {}; } },
  save(h) { try { localStorage.setItem(R.STORAGE.HISTORY, JSON.stringify(h)); } catch {} },
  record(agentId, positionId, date) {
    const h = this.get();
    if (!h[agentId]) h[agentId] = [];
    h[agentId].unshift({ positionId, date: localDateKey(date || _state.date), ts: Date.now() });
    if (h[agentId].length > 60) h[agentId] = h[agentId].slice(0, 60);
    this.save(h);
  },
  recordDescanso(agentId, date) { this.record(agentId, '__descanso__', date); },
  getConsecutiveDaysInPosition(agentId, positionId) {
    let count = 0;
    for (let daysBack = 1; daysBack <= 30; daysBack++) {
      const d = new Date(_state.date); d.setDate(d.getDate() - daysBack);
      const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(d)}`;
      try {
        const saved = localStorage.getItem(key); if (!saved) break;
        if ((JSON.parse(saved)[positionId] || []).includes(agentId)) count++; else break;
      } catch { break; }
    }
    return count;
  },
  getConsecutiveDaysInSequence(agentId, sequenceType) {
    let count = 0;
    for (let daysBack = 1; daysBack <= 30; daysBack++) {
      const d = new Date(_state.date); d.setDate(d.getDate() - daysBack);
      const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(d)}`;
      try {
        const saved = localStorage.getItem(key);
        if (!saved) break;
        const dayAssignments = JSON.parse(saved) || {};
        const did = Object.keys(dayAssignments).some(pid => {
          const ids = dayAssignments[pid] || [];
          if (!ids.includes(agentId)) return false;
          return R.getPositionSequenceType(pid) === sequenceType;
        });
        if (did) count++; else break;
      } catch { break; }
    }
    return count;
  },
  getConsecutiveReps(agentId, positionId) { return this.getConsecutiveDaysInPosition(agentId, positionId); },
  getMaxReps(agentId, positionId) {
    if (positionId === 'recibe') return R.MAX_REPS_RECIBE;
    const all = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
    const a = all.find(x => x.id === agentId);
    return (a && a.type === 'supervisor') ? R.MAX_REPS_SUPERVISOR : R.MAX_REPS_TRAFFIC;
  },
  canAssign(agentId, positionId) {
    if (ROSTER.isAgentInObservacion && ROSTER.isAgentInObservacion(agentId, _state.date)) return true;
    const all = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
    const a = all.find(x => x.id === agentId);
    if (a && a.type === 'supervisor') return true;
    const byPos = this.getConsecutiveDaysInPosition(agentId, positionId) < this.getMaxReps(agentId, positionId);
    const seqType = R.getPositionSequenceType(positionId);
    const bySeq = this.getConsecutiveDaysInSequence(agentId, seqType) < 2;
    return byPos && bySeq;
  },
};

function getRecibeRecentCounts() {
  const counts = {};
  for (let d = 1; d <= 14; d++) {
    const day = dateMinusOneDay(new Date(_state.date)); day.setDate(day.getDate() - (d - 1));
    const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(day)}`;
    try { const saved = localStorage.getItem(key); if (!saved) continue; (JSON.parse(saved)['recibe'] || []).forEach(id => { counts[id] = (counts[id] || 0) + (15 - d); }); } catch {}
  }
  return counts;
}
function didRecibeYesterday(agentId) {
  const yest = dateMinusOneDay(_state.date);
  try { const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`); return saved ? (JSON.parse(saved)['recibe'] || []).includes(agentId) : false; } catch { return false; }
}
function getPositionRecentCounts(posId) {
  const counts = {};
  for (let d = 1; d <= 14; d++) {
    const day = dateMinusOneDay(new Date(_state.date)); day.setDate(day.getDate() - (d - 1));
    const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(day)}`;
    try { const saved = localStorage.getItem(key); if (!saved) continue; (JSON.parse(saved)[posId] || []).forEach(id => { counts[id] = (counts[id] || 0) + (15 - d); }); } catch {}
  }
  return counts;
}
function wasInPositionYesterday(agentId, posId) {
  const yest = dateMinusOneDay(_state.date);
  try { const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`); return saved ? (JSON.parse(saved)[posId] || []).includes(agentId) : false; } catch { return false; }
}
function getBoardingRolesYesterday(posId) {
  const yest = dateMinusOneDay(_state.date);
  try { const saved = localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${localDateKey(yest)}`); return saved ? (JSON.parse(saved)[posId] || null) : null; } catch { return null; }
}

function getAgentAssignedPositions(agentId) {
  const active = R.getActivePositions(_state.date);
  return active.filter(p => (_state.assignments[p.id] || []).includes(agentId));
}
function agentHasBreak(agentId) { return _state.breaks[agentId] !== undefined; }
function scoreAgent(agent, position) {
  const skillScore = position.skills.reduce((s, sk) => s + (agent.skills[sk] || 0), 0);
  const reps = historyManager.getConsecutiveReps(agent.id, position.id);
  const load = getAgentAssignedPositions(agent.id).length;
  return (skillScore * 100) - (reps * 50) - (load * 30);
}
function assignAgent(agent, position) {
  if (!_state.assignments[position.id]) _state.assignments[position.id] = [];
  if (_state.assignments[position.id].includes(agent.id)) return;
  _state.assignments[position.id].push(agent.id);
  historyManager.record(agent.id, position.id);
}

function evaluateAssignment(agent, pos) {
  const date = _state.date;
  const agentPos = getAgentAssignedPositions(agent.id);
  const hasBreak = agentHasBreak(agent.id);
  const res = R.evaluatePositionAssignment(agent, pos, agentPos, date, hasBreak);
  const violations = [...(res.violations || [])];
  if (agent.type !== 'supervisor') {
    if (!historyManager.canAssign(agent.id, pos.id)) {
      violations.push(R.RESTRICTIONS.SEQUENCE_LIMIT);
    }
    if (pos.id === 'quiosco' && historyManager.getConsecutiveDaysInPosition(agent.id, 'quiosco') >= 1) {
      violations.push(R.RESTRICTIONS.QUIOSCO_NO_CONSECUTIVE);
    }
  }
  return { ok: violations.length === 0, violations };
}

function autoAssignTraffic() {
  const date = _state.date;
  const trafficAgents = (ROSTER.trafficAgents || []).filter(a => R.canAgentBeAssigned(a.id, date));
  const positions = R.getActivePositions(date).filter(p => p.pool === 'traffic');
  const priority = p => p.id === 'embarque_kl686' ? 5 : p.id.startsWith('mostrador_') ? 4 : p.id.startsWith('embarque_') ? 3 : p.critical ? 2 : 1;
  const sorted = [...positions].sort((a, b) => priority(b) - priority(a));
  let assigned = 0;

  function wasInMostradorYesterday(agentId) {
    const yest = dateMinusOneDay(_state.date);
    try {
      const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`);
      if (!saved) return false;
      const day = JSON.parse(saved) || {};
      return Object.keys(day).some(pid => pid.startsWith('mostrador_') && (day[pid] || []).includes(agentId));
    } catch { return false; }
  }

  function assignNewTraineesRotation() {
    const ids = ROSTER.agentes.filter(function(a){ return R.isTrainee(a.id); }).map(function(a){ return a.id; });
    const byId = new Map(trafficAgents.map(a => [a.id, a]));
    const mostradores = positions.filter(p => p.id.startsWith('mostrador_'));
    const quioscoPos = positions.find(p => p.id === 'quiosco');
    const assignedSet = new Set(Object.values(_state.assignments).flat());

    for (const id of ids) {
      const agent = byId.get(id);
      if (!agent) continue;
      if (assignedSet.has(id)) continue;
      if (agentHasBreak(id)) continue;
      if (reservedForAduana.has(id)) continue;

      const yQuio = wasInPositionYesterday(id, 'quiosco');
      const yMost = wasInMostradorYesterday(id);

      const quioscoCount = (_state.assignments['quiosco'] || []).length;
      const quioscoCap = (quioscoPos && quioscoPos.maxAgents) ? quioscoPos.maxAgents : 0;
      const tryAssignQuiosco = () => {
        if (!quioscoPos) return false;
        if (quioscoCount >= quioscoCap) return false;
        if (!evaluateAssignment(agent, quioscoPos).ok) return false;
        assignAgent(agent, quioscoPos);
        logRuleViolation({ action: 'traineeRotation', agentId: id, targetPos: 'quiosco', violations: [] });
        assignedSet.add(id);
        return true;
      };

      const tryAssignMostrador = () => {
        const candidateMost = mostradores
          .map(p => ({ pos: p, cur: (_state.assignments[p.id] || []).length }))
          .sort((a, b) => a.cur - b.cur);
        const picked = candidateMost.map(x => x.pos).find(p => evaluateAssignment(agent, p).ok);
        if (!picked) return false;
        assignAgent(agent, picked);
        logRuleViolation({ action: 'traineeRotation', agentId: id, targetPos: picked.id, violations: [] });
        assignedSet.add(id);
        return true;
      };

      if (yQuio) {
        if (tryAssignMostrador()) continue;
        continue;
      }

      if (yMost) {
        if (tryAssignQuiosco()) continue;
        if (tryAssignMostrador()) continue;
        continue;
      }

      if (tryAssignMostrador()) continue;
      if (tryAssignQuiosco()) continue;
    }
  }

  if (ROSTER.isAgentInObservacion) {
    const obsAgents = trafficAgents.filter(a => ROSTER.isAgentInObservacion(a.id, date));
    const mostradorIds = ['mostrador_econ', 'mostrador_prio1', 'mostrador_prio2', 'mostrador_prio3'];
    for (const agent of obsAgents) {
      if (reservedForAduana.has(agent.id)) continue;
      for (const mId of mostradorIds) {
        const mPos = positions.find(p => p.id === mId);
        if (!mPos) continue;
        const current = (_state.assignments[mId] || []).filter(id => R.canAgentBeAssigned(id, date));
        if (current.length >= mPos.minAgents) continue;
        const agentPos = getAgentAssignedPositions(agent.id);
        if (!R.canAgentTakePosition(agent, mPos, agentPos, date, agentHasBreak(agent.id))) continue;
        if (!historyManager.canAssign(agent.id, mPos.id)) continue;
        assignAgent(agent, mPos); assigned++; break;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // FASE DE RESERVA PARA ADUANA
  // Aduana es aislada (1 posición única) y de baja prioridad.
  // Si no reservamos agentes A5 ANTES del loop principal, la mayoría
  // son consumidos por mostradores/embarques y aduana queda incompleta.
  // ═══════════════════════════════════════════════════════════════════
  const aduanaPos = sorted.find(p => p.id === 'equipaje_general');
  const reservedForAduana = new Set();
  if (aduanaPos) {
    const aduanaCurrent = (_state.assignments[aduanaPos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
    const aduanaNeeded = aduanaPos.minAgents - aduanaCurrent.length;
    if (aduanaNeeded > 0) {
      const aduanaQualified = trafficAgents.filter(a => {
        const agentPos = getAgentAssignedPositions(a.id);
        return R.canAgentTakePosition(a, aduanaPos, agentPos, date, agentHasBreak(a.id)) && historyManager.canAssign(a.id, aduanaPos.id);
      });
      if (aduanaQualified.length > 0) {
        const counts = getPositionRecentCounts(aduanaPos.id);
        const scored = aduanaQualified.map(a => ({ agent: a, score: scoreAgent(a, aduanaPos) - (counts[a.id] || 0) * 0.5 })).sort((a, b) => b.score - a.score);
        scored.slice(0, aduanaNeeded).forEach(({ agent }) => { reservedForAduana.add(agent.id); });
      }
    }
  }

  for (const pos of sorted) {
    if (pos.id === 'loby_prep_mostradores') continue; // se asigna al final con lógica especial
    const current = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
    const needed = pos.minAgents - current.length;
    if (needed <= 0) continue;
    const qualified = trafficAgents.filter(a => {
      if (reservedForAduana.has(a.id) && pos.id !== 'equipaje_general') return false;
      const agentPos = getAgentAssignedPositions(a.id);
      return R.canAgentTakePosition(a, pos, agentPos, date, agentHasBreak(a.id)) && historyManager.canAssign(a.id, pos.id);
    });
    const eligible = qualified;
    if (eligible.length === 0) continue;

    if (pos.id === 'recibe') {
      const counts = getRecibeRecentCounts();
      const sinAyer = eligible.filter(a => !didRecibeYesterday(a.id));
      const pool = sinAyer.length > 0 ? sinAyer : eligible;
      pool.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
      assignAgent(pool[0], pos); assigned++; continue;
    }
    if (pos.id.startsWith('embarque_')) {
      const counts = getPositionRecentCounts(pos.id);
      const sinAyer = eligible.filter(a => !wasInPositionYesterday(a.id, pos.id));
      const pool = sinAyer.length >= needed ? sinAyer : eligible;
      pool.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
      const toAssign = pool.slice(0, needed);
      if (pos.requiresBag) {
        const minSkill = R.MIN_BOARDING_ROLE_SKILL;
        const currentHasBag = current.some(id => { const ag = trafficAgents.find(x => x.id === id); return ag && (ag.skills.A1 || 0) >= minSkill; });
        if (!currentHasBag) {
          const newHasBag = toAssign.some(a => (a.skills.A1 || 0) >= minSkill);
          if (!newHasBag) {
            const bagCandidate = pool.find(a => (a.skills.A1 || 0) >= minSkill && !toAssign.includes(a));
            if (bagCandidate && toAssign.length > 0) toAssign[toAssign.length - 1] = bagCandidate;
          }
        }
      }
      toAssign.forEach(a => { assignAgent(a, pos); assigned++; }); continue;
    }
    if (pos.id === 'equipaje_general') {
      const counts = getPositionRecentCounts(pos.id);
      // 1. Asignar primero los agentes reservados
      reservedForAduana.forEach(id => {
        const agent = trafficAgents.find(a => a.id === id);
        if (agent && !current.includes(id)) { assignAgent(agent, pos); assigned++; }
      });
      // 2. Si aún faltan, completar del pool general con penalty ligero
      const stillNeeded = pos.minAgents - (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date)).length;
      if (stillNeeded > 0) {
        const remaining = eligible.filter(a => !reservedForAduana.has(a.id));
        const scored = remaining.map(a => ({ agent: a, score: scoreAgent(a, pos) - (counts[a.id] || 0) * 0.5 })).sort((a, b) => b.score - a.score);
        scored.slice(0, stillNeeded).forEach(({ agent }) => { assignAgent(agent, pos); assigned++; });
      }
      continue;
    }
    const scored = eligible.map(a => ({ agent: a, score: scoreAgent(a, pos) })).sort((a, b) => b.score - a.score);
    scored.slice(0, needed).forEach(({ agent }) => { assignAgent(agent, pos); assigned++; });
  }

  assignNewTraineesRotation();

  // ── ASIGNACIÓN LOBY (después de todo, preferentemente a agentes con mostrador) ──
  const lobyPos = positions.find(p => p.id === 'loby_prep_mostradores');
  if (lobyPos) {
    const currentLoby = (_state.assignments['loby_prep_mostradores'] || []).length;
    const neededLoby = Math.max(0, 1 - currentLoby); // mínimo 1 agente
    if (neededLoby > 0) {
      const withMostrador = trafficAgents.filter(a => {
        const agentPos = getAgentAssignedPositions(a.id);
        const hasMostrador = agentPos.some(p => p.id.startsWith('mostrador_'));
        return hasMostrador && R.canAgentTakePosition(a, lobyPos, agentPos, date, agentHasBreak(a.id)) && historyManager.canAssign(a.id, lobyPos.id);
      });
      const anyAvailable = trafficAgents.filter(a => {
        const agentPos = getAgentAssignedPositions(a.id);
        return R.canAgentTakePosition(a, lobyPos, agentPos, date, agentHasBreak(a.id)) && historyManager.canAssign(a.id, lobyPos.id);
      });
      const pool = withMostrador.length >= neededLoby ? withMostrador : anyAvailable;
      pool.slice(0, neededLoby).forEach(a => { assignAgent(a, lobyPos); assigned++; });
    }
    // Segundo agente si hay disponibles (promedio deseado = 2)
    const currentAfter = (_state.assignments['loby_prep_mostradores'] || []).length;
    if (currentAfter < 2) {
      const extraNeeded = 2 - currentAfter;
      const extraPool = trafficAgents.filter(a => {
        const agentPos = getAgentAssignedPositions(a.id);
        return !(_state.assignments['loby_prep_mostradores'] || []).includes(a.id) &&
          R.canAgentTakePosition(a, lobyPos, agentPos, date, agentHasBreak(a.id)) &&
          historyManager.canAssign(a.id, lobyPos.id);
      });
      const extraWithMostrador = extraPool.filter(a => {
        const agentPos = getAgentAssignedPositions(a.id);
        return agentPos.some(p => p.id.startsWith('mostrador_'));
      });
      const extraFinal = extraWithMostrador.length >= extraNeeded ? extraWithMostrador : extraPool;
      extraFinal.slice(0, extraNeeded).forEach(a => { assignAgent(a, lobyPos); assigned++; });
    }
  }

  const quioscoPos = positions.find(p => p.id === 'quiosco');
  if (quioscoPos) {
    const assignedSet = new Set(Object.values(_state.assignments).flat());
    const quioscoActual = (_state.assignments['quiosco'] || []).length;
    const slotsLibres = (quioscoPos.maxAgents || 5) - quioscoActual;
    if (slotsLibres > 0) {
      const candidates = trafficAgents.filter(a => !assignedSet.has(a.id) && evaluateAssignment(a, quioscoPos).ok);
      for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
      candidates.map(a => ({ agent: a, score: scoreAgent(a, quioscoPos) })).sort((a, b) => b.score - a.score)
        .slice(0, slotsLibres).forEach(({ agent }) => { assignAgent(agent, quioscoPos); assigned++; });
    }
  }
  return assigned;
}

function autoAssignSupervisors() {
  const date = _state.date;
  let available = (ROSTER.supervisorAgents || []).filter(s => R.canAgentBeAssigned(s.id, date) && !Object.values(_state.assignments).flat().includes(s.id) && !agentHasBreak(s.id));
  const supPositions = R.getActivePositions(date).filter(p => p.pool === 'supervisor');
  const yest = dateMinusOneDay(date);
  let yestAssignments = {};
  try {
    const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`);
    yestAssignments = saved ? JSON.parse(saved) : {};
  } catch { yestAssignments = {}; }
  const yestPosBySup = {};
  supPositions.forEach(p => {
    (yestAssignments[p.id] || []).forEach(id => { yestPosBySup[id] = p.id; });
  });

  let assigned = 0;
  for (const pos of supPositions) {
    const current = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
    if (current.length >= pos.minAgents) continue;
    const recentCounts = getPositionRecentCounts(pos.id);
    const qualified = available.filter(s => evaluateAssignment(s, pos).ok);
    const nonRepeat = qualified.filter(s => yestPosBySup[s.id] !== pos.id);
    const pool = nonRepeat.length > 0 ? nonRepeat : qualified;
    const eligible = pool.map(s => ({ sup: s, score: (recentCounts[s.id] || 0) })).sort((a, b) => a.score - b.score);
    if (eligible.length === 0) continue;
    const minScore = eligible[0].score;
    const top = eligible.filter(e => e.score === minScore).map(e => e.sup);
    for (let i = top.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [top[i], top[j]] = [top[j], top[i]]; }
    const sup = top[0];
    assignAgent(sup, pos);
    logRuleViolation({ action: 'autoAssignSupervisors', agentId: sup.id, targetPos: pos.id, violations: [] });
    if (pos.id === 'supervisor_gate') R._setGateAgentId(sup.id);
    available = available.filter(s => s.id !== sup.id); assigned++;
  }
  return assigned;
}

function autoAssignBreaks() {
  const date = _state.date;
  const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])].filter(a => R.canAgentHaveBreak(a.id, date));
  let needBreak = allAgents.filter(a => _state.breaks[a.id] === undefined);
  if (needBreak.length === 0) return 0;

  const rawSlots = R.getActiveBreakSlots(date);
  let slots = rawSlots.filter(s => !s.blocked).map(s => ({ ...s, current: Object.values(_state.breaks).filter(t => t === s.start).length }));
  const totalCap = slots.reduce((sum, s) => sum + s.max, 0);
  if (needBreak.length > totalCap) { const deficit = needBreak.length - totalCap; const inc = Math.ceil(deficit / slots.length); slots.forEach(s => { s.max += inc; }); }

  const newBreaks = { ...(_state.breaks) };
  let assigned = 0;
  const unassigned = [];
  const bestSlot = (filterFn) => slots.filter(s => s.current < s.max && (!filterFn || filterFn(s))).sort((a, b) => (a.current / a.max) - (b.current / b.max))[0];
  const chronoSlot = () => slots.filter(s => s.current < s.max).sort((a, b) => a.start - b.start)[0];

  const recibeId = (_state.assignments['recibe'] || [])[0];
  if (recibeId && !newBreaks[recibeId]) {
    const sl = chronoSlot(); if (sl) { newBreaks[recibeId] = sl.start; sl.current++; assigned++; }
    needBreak = needBreak.filter(a => a.id !== recibeId);
  }
  const isFlightWindow = (slotStart) => { const se = slotStart + 60; return R.BLOCKED_BREAK_WINDOWS.some(w => slotStart < w.end && se > w.start); };
  const gateId = (_state.assignments['supervisor_gate'] || [])[0];
  if (gateId && !newBreaks[gateId]) {
    const sl = bestSlot(s => !isFlightWindow(s.start)); if (sl) { newBreaks[gateId] = sl.start; sl.current++; assigned++; }
    needBreak = needBreak.filter(a => a.id !== gateId);
  }

  const aduanaNeed = needBreak.filter(a => getAgentAssignedPositions(a.id).some(p => p.area === 'aduana'));
  aduanaNeed.forEach(agent => {
    if (newBreaks[agent.id] !== undefined) return;
    const agentPos = getAgentAssignedPositions(agent.id);
    const sl = slots.filter(s => s.current < s.max && R.isBreakCompatible(agentPos, s)).sort((a, b) => a.start - b.start)[0];
    if (sl) { newBreaks[agent.id] = sl.start; sl.current++; assigned++; }
  });
  needBreak = needBreak.filter(a => newBreaks[a.id] === undefined);

  const withoutPos = needBreak.filter(a => getAgentAssignedPositions(a.id).length === 0);
  withoutPos.forEach(agent => { const sl = bestSlot(); if (sl) { newBreaks[agent.id] = sl.start; sl.current++; assigned++; } });
  needBreak = needBreak.filter(a => !newBreaks[a.id]);

  // ── MODIFICACIÓN QUIRÚRGICA: CRÍTICAS PRIMERO + PRE-TURNO ──
  const withCritical = needBreak.filter(a => getAgentAssignedPositions(a.id).some(p => p.critical));
  const withNonCritical = needBreak.filter(a => getAgentAssignedPositions(a.id).every(p => !p.critical));

  function hasCoverageForCritical(agent, sl) {
    const agentPos = getAgentAssignedPositions(agent.id);
    const criticalOverlapping = agentPos.filter(pos => pos.critical && R.breakOverlapsPosition(sl.start, pos.time));
    if (criticalOverlapping.length === 0) return true;
    const cvStart = 900 + sl.start; const cvEnd = cvStart + 60;
    const allAg = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
    return criticalOverlapping.every(pos => allAg.some(a => {
      if (a.id === agent.id) return false;
      if (!R.canAgentBeAssigned(a.id, date)) return false;
      return R.canAgentCover(a, pos, date, getAgentAssignedPositions(a.id), newBreaks[a.id], cvStart, cvEnd, 0);
    }));
  }

  for (const agent of [...withCritical, ...withNonCritical]) {
    const agentPos = getAgentAssignedPositions(agent.id);
    const hasCritical = agentPos.some(p => p.critical);
    let criticalStartMin = Infinity;
    if (hasCritical) {
      agentPos.filter(p => p.critical).forEach(p => {
        const parsed = R.parsePositionTime(p.time);
        if (parsed.start < criticalStartMin) criticalStartMin = parsed.start;
      });
    }
    const sortedSlots = slots.filter(s => s.current < s.max).sort((a, b) => {
      const aEnd = 900 + a.start + 60; const bEnd = 900 + b.start + 60;
      const aBefore = aEnd <= criticalStartMin ? 0 : 1; const bBefore = bEnd <= criticalStartMin ? 0 : 1;
      if (aBefore !== bBefore) return aBefore - bBefore;
      return (a.current / a.max) - (b.current / b.max);
    });
    let done = false;
    for (const sl of sortedSlots) {
      if (R.isBoardingBlocked(agentPos, sl)) continue;
      if (!R.isBreakCompatible(agentPos, sl)) {
        if (!hasCritical) continue;
        if (!hasCoverageForCritical(agent, sl)) continue;
      }
      newBreaks[agent.id] = sl.start; sl.current++; assigned++; done = true; break;
    }
    if (!done) unassigned.push(agent);
  }

  for (const agent of unassigned) {
    const agentPos = getAgentAssignedPositions(agent.id);
    const hasCritical = agentPos.some(p => p.critical);
    let done = false;
    for (const sl of slots) {
      if (sl.blocked || R.isBoardingBlocked(agentPos, sl) || (hasCritical && !hasCoverageForCritical(agent, sl))) continue;
      newBreaks[agent.id] = sl.start; sl.current++; assigned++; done = true; break;
    }
    if (!done) {
      const fallback = slots.filter(s => !s.blocked && !R.isBoardingBlocked(agentPos, s)).sort((a, b) => a.current - b.current)[0];
      if (fallback) { newBreaks[agent.id] = fallback.start; fallback.current++; assigned++; }
    }
  }

  const breaksAntes = { ...(_state.breaks) };
  _state.breaks = newBreaks;
  Object.keys(newBreaks).forEach(id => { if (breaksAntes[id] === undefined) historyManager.recordDescanso(id); });
  return assigned;
}

function autoAssignCoberturas() {
  const date = _state.date;
  const positions = R.getActivePositions(date);
  const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
  _state.coberturas = {};
  const coverageLoad = {}; let total = 0;
  // Procesar posiciones críticas primero para asegurar cobertura
  const entries = Object.entries(_state.assignments).sort(([posIdA], [posIdB]) => {
    const posA = positions.find(p => p.id === posIdA);
    const posB = positions.find(p => p.id === posIdB);
    return (posB?.critical ? 1 : 0) - (posA?.critical ? 1 : 0);
  });
  entries.forEach(([posId, agentIds]) => {
    const pos = positions.find(p => p.id === posId); if (!pos) return;
    agentIds.forEach(agentId => {
      if (_state.breaks[agentId] === undefined) return;
      const sl = R.getActiveBreakSlots(date).find(s => s.start === _state.breaks[agentId]);
      if (!sl || !R.breakOverlapsPosition(sl.start, pos.time) || pos.id === 'supervisor_gate') return;
      const cvStart = 900 + sl.start; const cvEnd = cvStart + 60;
      const candidates = allAgents.filter(a => {
        if (a.id === agentId) return false;
        return R.canAgentCover(a, pos, date, getAgentAssignedPositions(a.id), _state.breaks[a.id], cvStart, cvEnd, coverageLoad[a.id] || 0);
      }).sort((a, b) => {
        const la = coverageLoad[a.id] || 0; const lb = coverageLoad[b.id] || 0;
        return ((a.type === 'supervisor' ? 20 : 0) + la) - ((b.type === 'supervisor' ? 20 : 0) + lb);
      });
      if (candidates.length === 0) return;
      const candidate = candidates.find(a => {
        const yaAsignadas = Object.values(_state.coberturas).flat().filter(c => c.agentId === a.id);
        return !yaAsignadas.some(c => { const [cs, ce] = c.timeRange.split('-'); return R.timesOverlap(R.timeStrToMinutes(cs), R.timeStrToMinutes(ce), cvStart, cvEnd); });
      });
      if (!candidate) return;
      if (!_state.coberturas[posId]) _state.coberturas[posId] = [];
      _state.coberturas[posId].push({ agentId: candidate.id, titularId: agentId, timeRange: sl.time });
      coverageLoad[candidate.id] = (coverageLoad[candidate.id] || 0) + 1; total++;
    });
  });
  return total;
}

function resolveBoardingRolesAll() {
  const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
  ['embarque_af179', 'embarque_kl686', 'embarque_af173'].forEach(posId => {
    const ids = _state.assignments[posId] || []; if (ids.length === 0) return;
    const agents = ids.map(id => allAgents.find(a => a.id === id)).filter(Boolean);
    const yesterday = getBoardingRolesYesterday(posId);
    const { titularAgent, bagAgent } = R.resolveBoardingRoles(posId, agents, yesterday);
    _state.boardingRoles[posId] = { titular: titularAgent?.id || null, bags: bagAgent?.id || null };
  });
}

function init(date) {
  _state.date = date;
  loadState(date);
  loadRuleLog(date);
  const gateId = (_state.assignments['supervisor_gate'] || [])[0];
  R._setGateAgentId(gateId || null);
}

// ═══════════════════════════════════════════════════════════════════
// ONBOARDING: Supervisores en capacitación
// mode: 'sombra'  → se registra en _state.sombras, NO ocupa el slot
//                   de assignments. El supervisor titular se asigna
//                   normalmente por autoAssignSupervisors().
// mode: 'titular' → asignación operativa real, ocupa el slot.
// Debe correr DESPUÉS de autoAssignSupervisors() para que las sombras
// no bloqueen la asignación del titular.
// ═══════════════════════════════════════════════════════════════════
function applyOnboarding() {
  const dateKey = localDateKey(_state.date);
  const schedule = ROSTER.onboardingSchedule || [];
  _state.sombras = {};
  let assigned = 0;

  for (const entry of schedule) {
    if (!entry.dates.includes(dateKey)) continue;
    if (!R.canAgentBeAssigned(entry.agentId, _state.date)) continue;
    if (R.isNoOperativo(entry.agentId)) {
      logRuleViolation({ action: 'onboarding', agentId: entry.agentId, targetPos: entry.targetPos, mode: entry.mode || 'titular', violations: [R.RESTRICTIONS.DIEGO_ASSIGNMENT_BLOCKED] });
      continue;
    }

    const mode = entry.mode || 'titular';

    if (mode === 'sombra') {
      // Registrar como observador sin ocupar el slot de assignments
      if (!_state.sombras[entry.targetPos]) _state.sombras[entry.targetPos] = [];
      if (!_state.sombras[entry.targetPos].includes(entry.agentId)) {
        _state.sombras[entry.targetPos].push(entry.agentId);
      }
      assigned++;
      continue;
    }

    // mode === 'titular': asignación operativa normal
    const current = _state.assignments[entry.targetPos] || [];
    if (current.includes(entry.agentId)) {
      assigned++;
      continue;
    }

    const positions = R.getActivePositions(_state.date);
    const pos = positions.find(p => p.id === entry.targetPos);
    if (!pos) continue;
    const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
    const agent = allAgents.find(a => a.id === entry.agentId);
    if (!agent) continue;
    const evalRes = evaluateAssignment(agent, pos);
    if (!evalRes.ok) {
      logRuleViolation({ action: 'onboarding', agentId: entry.agentId, targetPos: entry.targetPos, mode: 'titular', violations: evalRes.violations });
      continue;
    }
    if (!_state.assignments[entry.targetPos]) _state.assignments[entry.targetPos] = [];
    _state.assignments[entry.targetPos].push(entry.agentId);
    historyManager.record(entry.agentId, entry.targetPos);
    assigned++;

    if (entry.targetPos === 'supervisor_gate') R._setGateAgentId(entry.agentId);
  }
  return assigned;
}

function autoAssignAll() {
  const t = autoAssignTraffic();
  const s = autoAssignSupervisors();  // titulares primero
  const o = applyOnboarding();        // sombras después, sin competir por slots
  const b = autoAssignBreaks();
  resolveBoardingRolesAll();
  const c = autoAssignCoberturas();
  saveState();
  return { traffic: t, supervisors: s, onboarding: o, breaks: b, coberturas: c };
}
function manualAssign(agentId, positionId) {
  const date = _state.date; const positions = R.getActivePositions(date); const pos = positions.find(p => p.id === positionId);
  if (!pos) return { ok: false, error: 'Posición no encontrada' };
  const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])]; const agent = allAgents.find(a => a.id === agentId);
  if (!agent) return { ok: false, error: 'Agente no encontrado' };
  const evalRes = evaluateAssignment(agent, pos);
  if (!evalRes.ok) {
    const first = evalRes.violations[0] || { msg: 'Asignación no permitida' };
    logRuleViolation({ action: 'manualAssign', agentId, targetPos: positionId, violations: evalRes.violations });
    return { ok: false, error: first.msg, violations: evalRes.violations.map(v => v.code) };
  }
  assignAgent(agent, pos); if (pos.id === 'supervisor_gate') R._setGateAgentId(agentId);
  resolveBoardingRolesAll(); saveState(); return { ok: true };
}
function manualUnassign(agentId, positionId) {
  if (!_state.assignments[positionId]) return;
  _state.assignments[positionId] = _state.assignments[positionId].filter(id => id !== agentId);
  if (positionId === 'supervisor_gate' && R._getGateAgentId() === agentId) R._setGateAgentId(null);
  resolveBoardingRolesAll(); saveState();
}
function manualSetBreak(agentId, slotStart) {
  const date = _state.date; const slots = R.getActiveBreakSlots(date); const slot = slots.find(s => s.start === slotStart);
  const agentPos = getAgentAssignedPositions(agentId);
  if (!R.canAgentHaveBreak(agentId, date)) return { ok: false, error: 'Agente en curso o no disponible' };
  if (slot && slot.blocked) return { ok: false, error: 'Slot bloqueado (ventana de embarque)' };
  if (R.isBoardingBlocked(agentPos, { start: slotStart })) return { ok: false, error: 'El agente está en abordaje durante ese slot' };
  if (!R.isBreakCompatible(agentPos, { start: slotStart })) {
    const aduanaPos = agentPos.find(p => p.area === 'aduana');
    const v = aduanaPos ? R.RESTRICTIONS.BREAK_WINDOW_ADUANA : R.RESTRICTIONS.BREAK_OVERLAPS_CRITICAL;
    logRuleViolation({ action: 'manualSetBreak', agentId, slotStart, violations: [v] });
    return { ok: false, error: 'Slot incompatible con las posiciones del agente' };
  }
  _state.breaks[agentId] = slotStart; saveState(); return { ok: true };
}
function manualClearBreak(agentId) {
  delete _state.breaks[agentId];
  Object.keys(_state.coberturas).forEach(posId => { _state.coberturas[posId] = (_state.coberturas[posId] || []).filter(c => c.titularId !== agentId); });
  saveState();
}
function getState() { return { date: _state.date, assignments: { ..._state.assignments }, breaks: { ..._state.breaks }, coberturas: { ..._state.coberturas }, boardingRoles: { ..._state.boardingRoles }, sombras: { ...(_state.sombras || {}) } }; }
function getAgentInfo(agentId) {
  const date = _state.date; const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])]; const agent = allAgents.find(a => a.id === agentId);
  if (!agent) return null;
  const status = ROSTER.getAgentStatus(agentId, date); const positions = getAgentAssignedPositions(agentId);
  const breakSlotStart = _state.breaks[agentId]; const slots = R.getActiveBreakSlots(date);
  const breakSlot = breakSlotStart !== undefined ? slots.find(s => s.start === breakSlotStart) : null;
  const asCoverage = Object.entries(_state.coberturas).flatMap(([posId, list]) => list.filter(c => c.agentId === agentId).map(c => { const pos = R.getActivePositions(date).find(p => p.id === posId); return { position: pos, titularId: c.titularId, timeRange: c.timeRange }; }));
  const boardingRole = {}; Object.entries(_state.boardingRoles).forEach(([posId, roles]) => { if (roles.titular === agentId) boardingRole[posId] = 'titular'; else if (roles.bags === agentId) boardingRole[posId] = 'bags'; });
  return { agent, status, inCourse: R.isAgentInCourse(agentId, date), canWork: R.canAgentBeAssigned(agentId, date), positions, breakSlot, asCoverage, boardingRole };
}
function planMonth(year, month, options = {}) {
  const { overwrite = true, progressCb = null, startDay = 1 } = options;
  const daysInMonth = new Date(year, month, 0).getDate();
  const summary = { days: 0, skipped: 0, errors: [] };
  for (let day = Math.max(startDay, 1); day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day); const key = `${R.STORAGE.ASSIGNMENTS}_${localDateKey(date)}`;
    if (!overwrite && localStorage.getItem(key)) { summary.skipped++; if (progressCb) progressCb(day, daysInMonth, 'skipped'); continue; }
    try { _state.date = date; _state.assignments = {}; _state.breaks = {}; _state.coberturas = {}; _state.boardingRoles = {}; autoAssignAll(); summary.days++; } catch (e) { summary.errors.push({ day, error: e.message }); }
    if (progressCb) progressCb(day, daysInMonth, 'done');
  }
  init(_state.date); return summary;
}
function validate() {
  const issues = [...R.validate(_state.assignments, _state.breaks, _state.coberturas, _state.date, _state.boardingRoles, _state.sombras)];
  const date = _state.date;
  const yest = dateMinusOneDay(date);
  let yestAssignments = {};
  try {
    const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`);
    yestAssignments = saved ? JSON.parse(saved) : {};
  } catch { yestAssignments = {}; }

  const todayAssignments = _state.assignments || {};

  const anyMostradorYesterday = (agentId) => {
    return Object.keys(yestAssignments).some(pid => pid.startsWith('mostrador_') && (yestAssignments[pid] || []).includes(agentId));
  };
  const anyMostradorToday = (agentId) => {
    return Object.keys(todayAssignments).some(pid => pid.startsWith('mostrador_') && (todayAssignments[pid] || []).includes(agentId));
  };

  (todayAssignments['quiosco'] || []).forEach(id => {
    if ((yestAssignments['quiosco'] || []).includes(id)) {
      issues.push({ type: 'error', msg: `${id}: asignación consecutiva a Quiosco` });
    }
  });

  const supPositions = R.getActivePositions(date).filter(p => p.pool === 'supervisor');
  supPositions.forEach(pos => {
    (todayAssignments[pos.id] || []).forEach(id => {
      if ((yestAssignments[pos.id] || []).includes(id)) {
        issues.push({ type: 'error', msg: `${id}: supervisor repetido en ${pos.name} dos días seguidos` });
      }
    });
  });

  ROSTER.agentes.filter(function(a){ return R.isTrainee(a.id); }).map(function(a){ return a.id; }).forEach(id => {
    const yQ = (yestAssignments['quiosco'] || []).includes(id);
    const yM = anyMostradorYesterday(id);
    const tQ = (todayAssignments['quiosco'] || []).includes(id);
    const tM = anyMostradorToday(id);
    if (yM && tM) issues.push({ type: 'warning', msg: `${id}: se esperaba alternar Mostrador↔Quiosco` });
    if (yQ && tQ) issues.push({ type: 'error', msg: `${id}: se esperaba alternar Quiosco↔Mostrador` });
  });

  return issues;
}
function exportDayState(date) {
  const key = localDateKey(date || _state.date);
  return JSON.stringify({ version: '1.0', type: 'day', date: key, assignments: JSON.parse(localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${key}`) || '{}'), breaks: JSON.parse(localStorage.getItem(`${R.STORAGE.BREAKS}_${key}`) || '{}'), coberturas: JSON.parse(localStorage.getItem(`${R.STORAGE.COBERTURAS}_${key}`) || '{}'), boardingRoles: JSON.parse(localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${key}`) || '{}'), sombras: JSON.parse(localStorage.getItem(`${R.STORAGE.SOMBRAS}_${key}`) || '{}') }, null, 2);
}
function exportMonthState(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate(); const days = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day); const key = localDateKey(d); const a = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${key}`); if (!a) continue;
    days[key] = { assignments: JSON.parse(a || '{}'), breaks: JSON.parse(localStorage.getItem(`${R.STORAGE.BREAKS}_${key}`) || '{}'), coberturas: JSON.parse(localStorage.getItem(`${R.STORAGE.COBERTURAS}_${key}`) || '{}'), boardingRoles: JSON.parse(localStorage.getItem(`${R.STORAGE.BOARDING_ROLES}_${key}`) || '{}') };
  }
  return JSON.stringify({ version: '1.0', type: 'month', year, month, days }, null, 2);
}
function importDayState(json, targetDate) {
  let data; try { data = JSON.parse(json); } catch (e) { throw new Error('JSON inválido: ' + e.message); }
  const useDate = targetDate || (() => { const [y, m, d] = (data.date || '').split('-').map(Number); return (y && m && d) ? new Date(y, m - 1, d) : _state.date; })();
  _state.date = useDate; _state.assignments = data.assignments || {}; _state.breaks = data.breaks || {}; _state.coberturas = data.coberturas || {}; _state.boardingRoles = data.boardingRoles || {}; _state.sombras = data.sombras || {};
  Object.keys(_state.assignments).forEach(posId => { _state.assignments[posId] = (_state.assignments[posId] || []).filter(id => R.canAgentBeAssigned(id, useDate)); });
  const gateId = (_state.assignments['supervisor_gate'] || [])[0]; R._setGateAgentId(gateId || null); saveState(); return true;
}
function importMonthState(json) {
  let data; try { data = JSON.parse(json); } catch (e) { throw new Error('JSON inválido: ' + e.message); }
  if (data.type !== 'month') throw new Error('El archivo no contiene un estado mensual');
  let imported = 0;
  Object.entries(data.days || {}).forEach(([key, dayData]) => {
    const [y, m, d] = key.split('-').map(Number); if (!y || !m || !d) return; const date = new Date(y, m - 1, d);
    const assignments = { ...(dayData.assignments || {}) };
    Object.keys(assignments).forEach(posId => { assignments[posId] = (assignments[posId] || []).filter(id => R.canAgentBeAssigned(id, date)); });
    try { localStorage.setItem(`${R.STORAGE.ASSIGNMENTS}_${key}`, JSON.stringify(assignments)); localStorage.setItem(`${R.STORAGE.BREAKS}_${key}`, JSON.stringify(dayData.breaks || {})); localStorage.setItem(`${R.STORAGE.COBERTURAS}_${key}`, JSON.stringify(dayData.coberturas || {})); localStorage.setItem(`${R.STORAGE.BOARDING_ROLES}_${key}`, JSON.stringify(dayData.boardingRoles || {})); imported++; } catch (e) { console.warn('[PLANNER] Error importando día', key, e); }
  });
  return { imported };
}
function fillEmptyTrafficPositions() {
  const date = _state.date;
  const trafficAgents = (ROSTER.trafficAgents || []).filter(a => R.canAgentBeAssigned(a.id, date));
  const positions = R.getActivePositions(date).filter(p => p.pool === 'traffic');
  const priority = p => p.id === 'embarque_kl686' ? 5 : p.id.startsWith('mostrador_') ? 4 : p.id.startsWith('embarque_') ? 3 : p.critical ? 2 : 1;
  const sorted = [...positions].sort((a, b) => priority(b) - priority(a));
  let assigned = 0;

  for (const pos of sorted) {
    const current = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
    const needed = pos.minAgents - current.length;
    if (needed <= 0) continue;
    const qualified = trafficAgents.filter(a => {
      const agentPos = getAgentAssignedPositions(a.id);
      return R.canAgentTakePosition(a, pos, agentPos, date, agentHasBreak(a.id)) && historyManager.canAssign(a.id, pos.id);
    });
    const eligible = qualified;
    if (eligible.length === 0) continue;

    if (pos.id === 'recibe') {
      const counts = getRecibeRecentCounts();
      const sinAyer = eligible.filter(a => !didRecibeYesterday(a.id));
      const pool = sinAyer.length > 0 ? sinAyer : eligible;
      pool.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
      assignAgent(pool[0], pos); assigned++; continue;
    }
    if (pos.id.startsWith('embarque_')) {
      const counts = getPositionRecentCounts(pos.id);
      const sinAyer = eligible.filter(a => !wasInPositionYesterday(a.id, pos.id));
      const pool = sinAyer.length >= needed ? sinAyer : eligible;
      pool.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
      const toAssign = pool.slice(0, needed);
      if (pos.requiresBag) {
        const minSkill = R.MIN_BOARDING_ROLE_SKILL;
        const currentHasBag = current.some(id => { const ag = trafficAgents.find(x => x.id === id); return ag && (ag.skills.A1 || 0) >= minSkill; });
        if (!currentHasBag) {
          const newHasBag = toAssign.some(a => (a.skills.A1 || 0) >= minSkill);
          if (!newHasBag) {
            const bagCandidate = pool.find(a => (a.skills.A1 || 0) >= minSkill && !toAssign.includes(a));
            if (bagCandidate && toAssign.length > 0) toAssign[toAssign.length - 1] = bagCandidate;
          }
        }
      }
      toAssign.forEach(a => { assignAgent(a, pos); assigned++; }); continue;
    }
    const scored = eligible.map(a => ({ agent: a, score: scoreAgent(a, pos) })).sort((a, b) => b.score - a.score);
    scored.slice(0, needed).forEach(({ agent }) => { assignAgent(agent, pos); assigned++; });
  }
  return assigned;
}

function fillEmptySupervisorPositions() {
  const date = _state.date;
  let available = (ROSTER.supervisorAgents || []).filter(s => R.canAgentBeAssigned(s.id, date) && !Object.values(_state.assignments).flat().includes(s.id) && !agentHasBreak(s.id));
  const supPositions = R.getActivePositions(date).filter(p => p.pool === 'supervisor');
  const yest = dateMinusOneDay(date);
  let yestAssignments = {};
  try {
    const saved = localStorage.getItem(`${R.STORAGE.ASSIGNMENTS}_${localDateKey(yest)}`);
    yestAssignments = saved ? JSON.parse(saved) : {};
  } catch { yestAssignments = {}; }
  const yestPosBySup = {};
  supPositions.forEach(p => {
    (yestAssignments[p.id] || []).forEach(id => { yestPosBySup[id] = p.id; });
  });

  let assigned = 0;
  for (const pos of supPositions) {
    const current = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date));
    if (current.length >= pos.minAgents) continue;
    const recentCounts = getPositionRecentCounts(pos.id);
    const qualified = available.filter(s => evaluateAssignment(s, pos).ok);
    const nonRepeat = qualified.filter(s => yestPosBySup[s.id] !== pos.id);
    const pool = nonRepeat.length > 0 ? nonRepeat : qualified;
    const eligible = pool.map(s => ({ sup: s, score: (recentCounts[s.id] || 0) })).sort((a, b) => a.score - b.score);
    if (eligible.length === 0) continue;
    const minScore = eligible[0].score;
    const top = eligible.filter(e => e.score === minScore).map(e => e.sup);
    for (let i = top.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [top[i], top[j]] = [top[j], top[i]]; }
    const sup = top[0];
    assignAgent(sup, pos);
    logRuleViolation({ action: 'autoAssignSupervisors', agentId: sup.id, targetPos: pos.id, violations: [] });
    if (pos.id === 'supervisor_gate') R._setGateAgentId(sup.id);
    available = available.filter(s => s.id !== sup.id); assigned++;
  }
  return assigned;
}

function recalculatePartial(date) {
  if (date) _state.date = date;
  loadState(_state.date);
  const gateId = (_state.assignments['supervisor_gate'] || [])[0];
  R._setGateAgentId(gateId || null);
  const t = fillEmptyTrafficPositions();
  const s = fillEmptySupervisorPositions();
  const o = applyOnboarding();
  const b = autoAssignBreaks();
  resolveBoardingRolesAll();
  const c = autoAssignCoberturas();
  saveState();
  return { traffic: t, supervisors: s, onboarding: o, breaks: b, coberturas: c };
}
function getStats() {
  const date = _state.date; const positions = R.getActivePositions(date); const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
  const enServicio = allAgents.filter(a => R.canAgentBeAssigned(a.id, date)).length;
  const enCurso = allAgents.filter(a => R.isAgentInCourse(a.id, date)).length;
  const descanso = allAgents.filter(a => ROSTER.getAgentStatus(a.id, date).status === 'descanso').length;
  const criticalCovered = positions.filter(p => p.critical && p.pool === 'traffic').every(pos => { const assigned = (_state.assignments[pos.id] || []).filter(id => R.canAgentBeAssigned(id, date)); return assigned.length >= pos.minAgents; });
  const agentsWithBreak = allAgents.filter(a => R.canAgentHaveBreak(a.id, date));
  const breakCoverage = agentsWithBreak.length > 0 ? agentsWithBreak.filter(a => _state.breaks[a.id] !== undefined).length : 0;
  return { total: allAgents.length, enServicio, enCurso, descanso, criticalCovered, breakCoverage, breakTotal: agentsWithBreak.length };
}

function explainPositionEligibility(positionId) {
  const date = _state.date;
  const pos = R.getActivePositions(date).find(p => p.id === positionId);
  if (!pos) return { ok: false, error: 'Posición no encontrada' };
  const allAgents = [...(ROSTER.trafficAgents || []), ...(ROSTER.supervisorAgents || [])];
  const poolAgents = allAgents.filter(a => (pos.pool ? a.type === pos.pool : true));
  const rows = poolAgents.map(a => {
    const agentPos = getAgentAssignedPositions(a.id);
    const hasBreak = agentHasBreak(a.id);
    const res = R.evaluatePositionAssignment(a, pos, agentPos, date, hasBreak);
    const byPos = historyManager.getConsecutiveDaysInPosition(a.id, pos.id);
    const seqType = R.getPositionSequenceType(pos.id);
    const bySeq = historyManager.getConsecutiveDaysInSequence(a.id, seqType);
    const okSeq = historyManager.canAssign(a.id, pos.id);
    const violations = [...(res.violations || [])];
    if (!okSeq) violations.push(R.RESTRICTIONS.SEQUENCE_LIMIT);
    return {
      agentId: a.id,
      name: a.name || a.nombre || a.id,
      status: ROSTER.getAgentStatus(a.id, date),
      ok: violations.length === 0,
      violations: violations.map(v => ({ code: v.code, msg: v.msg })),
      consecutive: { byPosition: byPos, bySequence: bySeq, sequenceType: seqType },
      alreadyAssigned: agentPos.map(p => p.id),
      hasBreak,
    };
  });
  rows.sort((a, b) => {
    if (a.ok !== b.ok) return a.ok ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return { ok: true, position: { id: pos.id, name: pos.name, time: pos.time, pool: pos.pool, minAgents: pos.minAgents }, candidates: rows };
}

window.PLANNER = {
  init, autoAssignAll, planMonth, autoAssignTraffic, autoAssignSupervisors, autoAssignBreaks, autoAssignCoberturas, resolveBoardingRolesAll,
  manualAssign, manualUnassign, manualSetBreak, manualClearBreak, getState, getAgentInfo, validate, getStats, clearState, saveState, localDateKey,
  exportDayState, exportMonthState, importDayState, importMonthState, recalculatePartial,
  getRuleLog: () => [..._ruleLog],
  explainPositionEligibility,
};
})();
