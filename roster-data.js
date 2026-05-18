(function () {
  'use strict';

  function getCfg() {
    return window.__CONFIG || {};
  }

  // ═══════════════════════════════════════════════════════════════════
  // VISTAS DERIVADAS — computed desde window.__CONFIG
  // ═══════════════════════════════════════════════════════════════════

  function getAgentes() {
    return getCfg().agentes || [];
  }

  function getAgentById(id) {
    var ag = getAgentes();
    for (var i = 0; i < ag.length; i++) {
      if (ag[i].id === id) return ag[i];
    }
    return null;
  }

  function getNotasAgente(agentId, date) {
    var agente = getAgentById(agentId);
    if (!agente || !agente.notas || agente.notas.length === 0) return [];
    var ts = date.getTime();
    var resultado = [];
    for (var i = 0; i < agente.notas.length; i++) {
      var nota = agente.notas[i];
      var desde = nota.desde ? new Date(nota.desde + 'T00:00:00').getTime() : null;
      var hasta = nota.hasta ? new Date(nota.hasta + 'T23:59:59').getTime() : null;
      var activa = true;
      if (desde !== null && ts < desde) activa = false;
      if (hasta !== null && ts > hasta) activa = false;
      if (activa) resultado.push(nota);
    }
    return resultado;
  }

  function parseDescansosString(str) {
    if (!str || typeof str !== 'string') return null;
    var diaMap = {
      'dom': 0, 'lun': 1, 'mar': 2, 'mie': 3, 'mié': 3,
      'jue': 4, 'vie': 5, 'sab': 6, 'sáb': 6
    };
    var partes = str.split('-');
    if (partes.length !== 2) return null;
    var d1 = diaMap[partes[0].toLowerCase().trim()];
    var d2 = diaMap[partes[1].toLowerCase().trim()];
    if (d1 === undefined || d2 === undefined) return null;
    return [d1, d2];
  }

  function getPatronDescansoEfectivo(agentId, date) {
    var agente = getAgentById(agentId);
    if (!agente) return null;

    var diasDescanso = null;
    var descansosStr = null;
    var esCambio = false;
    var cambioDesde = null;

    // Verificar cambios de descanso programados (aplicar el más reciente cuya fecha ya haya llegado)
    if (agente.cambiosDescanso && agente.cambiosDescanso.length > 0) {
      var ts = date.getTime();
      for (var ci = 0; ci < agente.cambiosDescanso.length; ci++) {
        var cambio = agente.cambiosDescanso[ci];
        var cd = new Date(cambio.desde + 'T00:00:00');
        if (ts >= cd.getTime()) {
          if (cambio.diasDescanso && cambio.diasDescanso.length > 0) {
            diasDescanso = cambio.diasDescanso;
          } else if (cambio.descansos) {
            diasDescanso = parseDescansosString(cambio.descansos);
          }
          descansosStr = cambio.descansos || null;
          esCambio = true;
          cambioDesde = cambio.desde;
        }
      }
    }

    if (!diasDescanso) {
      if (agente.descansoPatron && agente.descansoPatron.diasDescanso) {
        diasDescanso = agente.descansoPatron.diasDescanso;
      } else if (agente.descansos) {
        diasDescanso = parseDescansosString(agente.descansos);
      }
      descansosStr = agente.descansos || null;
    }

    if (!diasDescanso || diasDescanso.length === 0) return null;
    return {
      descansos: descansosStr,
      diasDescanso: diasDescanso,
      esCambio: esCambio,
      desde: cambioDesde,
      baseDescansos: agente.descansos || null
    };
  }

  function calcularDiaPorPatron(agentId, date) {
    var patron = getPatronDescansoEfectivo(agentId, date);
    if (!patron) return 'W';
    var dow = date.getDay(); // 0=Dom, 1=Lun, ...
    return patron.diasDescanso.indexOf(dow) !== -1 ? 'R' : 'W';
  }

  function esCumpleanos(agentId, date) {
    var agente = getAgentById(agentId);
    if (!agente || !agente.cumple) return false;
    var partes = agente.cumple.split('/');
    if (partes.length !== 2) return false;
    var diaCumple = parseInt(partes[0], 10);
    var mesCumple = parseInt(partes[1], 10);
    return date.getDate() === diaCumple && (date.getMonth() + 1) === mesCumple;
  }

  function getHorario() {
    return getCfg().horario || {};
  }

  function getIncapacidades() {
    return getCfg().incapacidades || [];
  }

  function getDescansosAjuste() {
    return getCfg().descansosAjuste || [];
  }

  function getDescansoLaborado() {
    return getCfg().descansoLaborado || [];
  }

  function getPermutas() {
    return getCfg().permutas || [];
  }

  function getPermisoEntradaTarde() {
    return getCfg().permisoEntradaTarde || [];
  }

  function getPermisoSinGoce() {
    return getCfg().permisoSinGoce || [];
  }

  function getCursosAduana() {
    return getCfg().cursosAduana || [];
  }

  function getCursosRecurrentes() {
    return getCfg().cursosRecurrentes || [];
  }

  function getObservacionPeriodos() {
    return getCfg().observacionPeriodos || [];
  }

  function getOnboardingSchedule() {
    return getCfg().onboardingSchedule || [];
  }

  function getWfmExcludedIds() {
    var raw = getCfg().wfmExcludedIds || [];
    return new Set(raw);
  }

  // ═══════════════════════════════════════════════════════════════════
  // FUNCIÓN PRINCIPAL DE ESTADO
  // ═══════════════════════════════════════════════════════════════════

  function getAgentStatus(agentId, date) {
    var mes = date.getMonth() + 1;
    var dia = date.getDate();

    var incap = getIncapacidades().find(
      function (i) { return i.id === agentId && i.mes === mes && dia >= i.diaInicio && dia <= i.diaFin; }
    );
    if (incap) return { status: 'incapacidad', label: 'Incapacidad', canWork: false };

    var cursoA = getCursosAduana().find(
      function (c) { return c.id === agentId && c.mes === mes && c.dias.indexOf(dia) !== -1; }
    );
    if (cursoA) return { status: 'curso', label: cursoA.label || 'Curso', canWork: false, horario: cursoA.horario || null };

    var cursoR = getCursosRecurrentes().find(
      function (c) { return c.id === agentId && c.entries.some(function (e) { return e.mes === mes && e.dias.indexOf(dia) !== -1; }); }
    );
    if (cursoR) return { status: 'curso-recurrente', label: 'Curso Rec. Gpo ' + cursoR.grupo, canWork: false, grupo: cursoR.grupo };

    var permiso = getPermisoEntradaTarde().find(
      function (p) { return p.id === agentId && p.mes === mes && p.dia === dia; }
    );
    if (permiso) return { status: 'permiso', label: 'Permiso', canWork: false, nota: permiso.nota };

    var sinGoce = getPermisoSinGoce().find(
      function (p) { return p.id === agentId && p.mes === mes && p.dia === dia; }
    );
    if (sinGoce) return { status: 'permiso-sin-goce', label: 'Permiso s/Goce', canWork: false, nota: sinGoce.nota };

    var ajuste = getDescansosAjuste().find(
      function (d) { return d.id === agentId && d.mes === mes && d.dia === dia; }
    );
    if (ajuste) return { status: 'descanso', label: 'Descanso Ajuste', canWork: false };

    var permutas = getPermutas();
    for (var pi = 0; pi < permutas.length; pi++) {
      var p = permutas[pi];
      var m1d = (p.id1_descansa_mes !== undefined) ? p.id1_descansa_mes : p.mes;
      var m1t = (p.id1_trabaja_mes  !== undefined) ? p.id1_trabaja_mes  : p.mes;
      var m2d = (p.id2_descansa_mes !== undefined) ? p.id2_descansa_mes : p.mes;
      var m2t = (p.id2_trabaja_mes  !== undefined) ? p.id2_trabaja_mes  : p.mes;
      if (p.id1 === agentId) {
        if (mes === m1d && dia === p.id1_descansa) return { status: 'descanso', label: 'Permuta Descanso', canWork: false, conQuien: p.nombre2 };
        if (mes === m1t && dia === p.id1_trabaja)  return { status: 'trabajo',  label: 'Permuta Trabajo',  canWork: true,  conQuien: p.nombre2 };
      }
      if (p.id2 === agentId) {
        if (mes === m2d && dia === p.id2_descansa) return { status: 'descanso', label: 'Permuta Descanso', canWork: false, conQuien: p.nombre1 };
        if (mes === m2t && dia === p.id2_trabaja)  return { status: 'trabajo',  label: 'Permuta Trabajo',  canWork: true,  conQuien: p.nombre1 };
      }
    }

    var dl = getDescansoLaborado().find(
      function (d) { return d.id === agentId && d.mes === mes && d.dia === dia; }
    );
    if (dl) return { status: 'trabajo', label: 'Descanso Laborado', canWork: true };

    var celda = calcularDiaPorPatron(agentId, date);
    var esDescanso = celda === 'R';

    if (!esDescanso && esCumpleanos(agentId, date)) {
      return {
        status: 'cumpleanos',
        label: 'Cumpleaños',
        canWork: false,
      };
    }

    return {
      status: esDescanso ? 'descanso' : 'trabajo',
      label:  esDescanso ? 'Descanso Base' : 'En Servicio',
      canWork: !esDescanso,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // FUNCIONES AUXILIARES
  // ═══════════════════════════════════════════════════════════════════

  function isAgentAvailable(agentId, date) {
    return getAgentStatus(agentId, date).canWork;
  }

  function getAvailableAgents(date) {
    return getAgentes().filter(function (a) { return isAgentAvailable(a.id, date); });
  }

  function getUnavailableAgents(date) {
    return getAgentes().filter(function (a) { return !isAgentAvailable(a.id, date); });
  }

  function getAvailabilityStats(date) {
    var stats = { trabajo: 0, descanso: 0, incapacidad: 0, permiso: 0, curso: 0, 'curso-recurrente': 0, total: getAgentes().length };
    getAgentes().forEach(function (a) {
      var st = getAgentStatus(a.id, date).status;
      if (st in stats) stats[st]++;
      else stats.trabajo++;
    });
    return stats;
  }

  // Helpers para compatibilidad con index.html
  function isCurso(agId, mes, dia) {
    return getCursosAduana().some(function (c) { return c.id === agId && c.mes === mes && c.dias.indexOf(dia) !== -1; });
  }
  function getCursoHorario(agId, mes, dia) {
    var e = getCursosAduana().find(function (c) { return c.id === agId && c.mes === mes && c.dias.indexOf(dia) !== -1; });
    return e ? (e.horario || null) : null;
  }
  function getCursoNota(agId, mes, dia) {
    var e = getCursosAduana().find(function (c) { return c.id === agId && c.mes === mes && c.dias.indexOf(dia) !== -1; });
    return e ? (e.nota || null) : null;
  }
  function getCursoLabel(agId, mes, dia) {
    var e = getCursosAduana().find(function (c) { return c.id === agId && c.mes === mes && c.dias.indexOf(dia) !== -1; });
    return e ? (e.label || 'Curso') : null;
  }
  function isCursoRecurrente(agId, mes, dia) {
    return getCursosRecurrentes().some(function (c) { return c.id === agId && c.entries.some(function (e) { return e.mes === mes && e.dias.indexOf(dia) !== -1; }); });
  }
  function getCursoRecurrenteGrupo(agId, mes, dia) {
    var e = getCursosRecurrentes().find(function (c) { return c.id === agId && c.entries.some(function (e) { return e.mes === mes && e.dias.indexOf(dia) !== -1; }); });
    return e ? e.grupo : null;
  }
  function isDescAjuste(agId, mes, dia) {
    return getDescansosAjuste().some(function (d) { return d.id === agId && d.mes === mes && d.dia === dia; });
  }
  function getDescAjusteNota(agId, mes, dia) {
    var e = getDescansosAjuste().find(function (d) { return d.id === agId && d.mes === mes && d.dia === dia; });
    return e ? (e.nota || null) : null;
  }
  function isPermisoTarde(agId, mes, dia) {
    return getPermisoEntradaTarde().some(function (p) { return p.id === agId && p.mes === mes && p.dia === dia; });
  }
  function getPermisoNota(agId, mes, dia) {
    var e = getPermisoEntradaTarde().find(function (p) { return p.id === agId && p.mes === mes && p.dia === dia; });
    return e ? (e.nota || null) : null;
  }
  function isPermisoSinGoce(agId, mes, dia) {
    return getPermisoSinGoce().some(function (p) { return p.id === agId && p.mes === mes && p.dia === dia; });
  }
  function getPermisoSinGoceNota(agId, mes, dia) {
    var e = getPermisoSinGoce().find(function (p) { return p.id === agId && p.mes === mes && p.dia === dia; });
    return e ? (e.nota || null) : null;
  }
  function isIncapacidad(agId, mes, dia) {
    return getIncapacidades().some(function (i) { return i.id === agId && i.mes === mes && dia >= i.diaInicio && dia <= i.diaFin; });
  }
  function isDescansoLaborado(agId, mes, dia) {
    return getDescansoLaborado().some(function (d) { return d.id === agId && d.mes === mes && d.dia === dia; });
  }
  function getDescansoLaboradoNota(agId, mes, dia) {
    var d = getDescansoLaborado().find(function (d) { return d.id === agId && d.mes === mes && d.dia === dia; });
    return d ? (d.nota || null) : null;
  }

  function isAgentInObservacion(agentId, date) {
    var mes = date.getMonth() + 1;
    var dia = date.getDate();
    return getObservacionPeriodos().some(function (p) {
      if (p.id !== agentId) return false;
      if (mes === p.mesInicio && mes === p.mesFin) return dia >= p.diaInicio && dia <= p.diaFin;
      if (mes === p.mesInicio) return dia >= p.diaInicio;
      if (mes === p.mesFin)   return dia <= p.diaFin;
      return mes > p.mesInicio && mes < p.mesFin;
    });
  }

  function getPermutaInfo(agId, mes, dia) {
    var permutas = getPermutas();
    for (var i = 0; i < permutas.length; i++) {
      var p = permutas[i];
      var m1d = (p.id1_descansa_mes !== undefined) ? p.id1_descansa_mes : p.mes;
      var m1t = (p.id1_trabaja_mes  !== undefined) ? p.id1_trabaja_mes  : p.mes;
      var m2d = (p.id2_descansa_mes !== undefined) ? p.id2_descansa_mes : p.mes;
      var m2t = (p.id2_trabaja_mes  !== undefined) ? p.id2_trabaja_mes  : p.mes;
      if (p.id1 === agId) {
        if (mes === m1t && dia === p.id1_trabaja)  return { tipo: 'permuta-trabajo',   conQuien: p.nombre2, conId: p.id2 };
        if (mes === m1d && dia === p.id1_descansa) return { tipo: 'permuta-descanso',  conQuien: p.nombre2, conId: p.id2 };
      }
      if (p.id2 === agId) {
        if (mes === m2t && dia === p.id2_trabaja)  return { tipo: 'permuta-trabajo',   conQuien: p.nombre1, conId: p.id1 };
        if (mes === m2d && dia === p.id2_descansa) return { tipo: 'permuta-descanso',  conQuien: p.nombre1, conId: p.id1 };
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // VISTAS DERIVADAS — para el WFM (usadas por planner.js)
  // ═══════════════════════════════════════════════════════════════════

  function getTrafficAgents() {
    return getAgentes()
      .filter(function (a) { return a.tipo === 'traffic' && !a.wfmExcluded; })
      .map(function (a) { return { id: a.id, name: a.name, skills: a.skills, type: 'traffic' }; });
  }

  function getSupervisorAgents() {
    return getAgentes()
      .filter(function (a) { return a.tipo === 'supervisor'; })
      .map(function (a) { return { id: a.id, name: a.name, skills: a.skills, type: 'supervisor' }; });
  }

  var _trafficCache = null;
  var _supervisorCache = null;

  function invalidateCache() {
    _trafficCache = null;
    _supervisorCache = null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPOSICIÓN PÚBLICA
  // ═══════════════════════════════════════════════════════════════════
  window.ROSTER = {
    get agentes() { return getAgentes(); },
    get horario() { return getHorario(); },
    get incapacidades() { return getIncapacidades(); },
    get descansosAjuste() { return getDescansosAjuste(); },
    get permutas() { return getPermutas(); },
    get permisoEntradaTarde() { return getPermisoEntradaTarde(); },
    get permisoSinGoce() { return getPermisoSinGoce(); },
    get cursosAduana() { return getCursosAduana(); },
    get cursosRecurrentes() { return getCursosRecurrentes(); },

    get trafficAgents() {
      if (!_trafficCache) _trafficCache = getTrafficAgents();
      return _trafficCache;
    },
    get supervisorAgents() {
      if (!_supervisorCache) _supervisorCache = getSupervisorAgents();
      return _supervisorCache;
    },
    get agentesWFM() {
      return this.trafficAgents.concat(this.supervisorAgents);
    },
    get onboardingSchedule() { return getOnboardingSchedule(); },
    get WFM_EXCLUDED_IDS() { return getWfmExcludedIds(); },

    getAgentStatus: getAgentStatus,
    isAgentAvailable: isAgentAvailable,
    getAvailableAgents: getAvailableAgents,
    getUnavailableAgents: getUnavailableAgents,
    getAvailabilityStats: getAvailabilityStats,
    getPatronDescansoEfectivo: getPatronDescansoEfectivo,
    getNotasAgente: getNotasAgente,

    isCurso: isCurso,
    getCursoHorario: getCursoHorario,
    getCursoNota: getCursoNota,
    getCursoLabel: getCursoLabel,
    isCursoRecurrente: isCursoRecurrente,
    getCursoRecurrenteGrupo: getCursoRecurrenteGrupo,
    isDescAjuste: isDescAjuste,
    getDescAjusteNota: getDescAjusteNota,
    isPermisoTarde: isPermisoTarde,
    getPermisoNota: getPermisoNota,
    isPermisoSinGoce: isPermisoSinGoce,
    getPermisoSinGoceNota: getPermisoSinGoceNota,
    isIncapacidad: isIncapacidad,
    getPermutaInfo: getPermutaInfo,
    isDescansoLaborado: isDescansoLaborado,
    getDescansoLaboradoNota: getDescansoLaboradoNota,
    isAgentInObservacion: isAgentInObservacion,
    invalidateCache: invalidateCache,
  };

})();
