window.__CONFIG = {
  "schedule": {
    "veranoMexStart": "2026-03-29",
    "normal": {
      "name": "Normal",
      "start": "15:00",
      "end": "23:30",
      "startMin": 0,
      "endMin": 510
    },
    "veranoMex": {
      "name": "Verano MEX",
      "start": "14:30",
      "end": "23:00",
      "startMin": -30,
      "endMin": 480
    }
  },
  "maxRepsTraffic": 2,
  "maxRepsSupervisor": 2,
  "maxRepsRecibe": 1,
  "minBoardingRoleSkill": 0.75,
  "maxEmbarquesPerAgent": 2,
  "maxCoberturasTraffic": 2,
  "storage": {
    "assignments": "wfm_assignments",
    "breaks": "wfm_breaks",
    "coberturas": "wfm_coberturas",
    "history": "wfm_agent_history",
    "boardingRoles": "wfm_boarding_roles",
    "theme": "stbc-theme"
  },
  "positionsNormal": [
    {
      "id": "recibe",
      "name": "Migracion/Recepcion de vuelos",
      "time": "17:25-21:15",
      "minAgents": 1,
      "skills": [
        "A0"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "loby_prep_mostradores",
      "name": "Loby/Preparar Mostradores",
      "time": "14:35-15:00",
      "minAgents": 1,
      "skills": [],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_econ",
      "name": "Mostrador Economy",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_drop1",
      "name": "Drop-Off 1",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_drop2",
      "name": "Drop-Off 2",
      "time": "15:00-21:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_prio1",
      "name": "Priority 1",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_prio2",
      "name": "Priority 2",
      "time": "15:00-21:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_prio3",
      "name": "Priority 3",
      "time": "15:00-21:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "quiosco",
      "name": "Apoyo Quioscos",
      "time": "16:00-20:00",
      "minAgents": 2,
      "skills": [
        "A3"
      ],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false,
      "maxAgents": 5
    },
    {
      "id": "embarque_af179",
      "name": "Abordaje AF179",
      "time": "18:25-19:15",
      "minAgents": 5,
      "skills": [
        "A2"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": true
    },
    {
      "id": "embarque_kl686",
      "name": "Abordaje KL686",
      "time": "19:30-20:05",
      "minAgents": 5,
      "skills": [
        "A2"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": true
    },
    {
      "id": "embarque_af173",
      "name": "Abordaje AF173",
      "time": "21:15-22:05",
      "minAgents": 5,
      "skills": [
        "A2"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": true
    },
    {
      "id": "equipaje_general",
      "name": "Aduana/Equipaje (Todos Vuelos)",
      "time": "17:45-21:45",
      "minAgents": 2,
      "skills": [
        "A5"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false,
      "shared": true,
      "area": "aduana"
    },
    {
      "id": "supervisor_control",
      "name": "Supervisor Control",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "C4"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    },
    {
      "id": "supervisor_caja",
      "name": "Supervisor Caja",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "C1"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    },
    {
      "id": "supervisor_gate",
      "name": "Supervisor Gate",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "C0"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    },
    {
      "id": "supervisor_s",
      "name": "Supervisor S",
      "time": "15:00-23:30",
      "minAgents": 1,
      "skills": [
        "C3"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    }
  ],
  "positionsVeranoMex": [
    {
      "id": "recibe",
      "name": "Migracion/Recepcion de vuelos",
      "time": "16:55-20:10",
      "minAgents": 1,
      "skills": [
        "A0"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "loby_prep_mostradores",
      "name": "Loby/Preparar Mostradores",
      "time": "15:05-15:30",
      "minAgents": 1,
      "skills": [],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_econ",
      "name": "Mostrador Economy",
      "time": "15:30-23:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_drop1",
      "name": "Drop-Off 1",
      "time": "15:30-23:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_drop2",
      "name": "Drop-Off 2",
      "time": "15:30-20:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_prio1",
      "name": "Priority 1",
      "time": "15:30-23:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_prio2",
      "name": "Priority 2",
      "time": "15:30-20:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "mostrador_prio3",
      "name": "Priority 3",
      "time": "15:30-20:00",
      "minAgents": 1,
      "skills": [
        "A3"
      ],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false
    },
    {
      "id": "quiosco",
      "name": "Apoyo Quioscos",
      "time": "15:30-19:30",
      "minAgents": 2,
      "skills": [
        "A3"
      ],
      "critical": false,
      "pool": "traffic",
      "requiresBag": false,
      "maxAgents": 5
    },
    {
      "id": "embarque_af179",
      "name": "Abordaje AF179",
      "time": "18:25-19:15",
      "minAgents": 5,
      "skills": [
        "A2"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": true
    },
    {
      "id": "embarque_kl686",
      "name": "Abordaje KL686",
      "time": "19:30-20:05",
      "minAgents": 5,
      "skills": [
        "A2"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": true
    },
    {
      "id": "embarque_af173",
      "name": "Abordaje AF173",
      "time": "21:15-22:05",
      "minAgents": 5,
      "skills": [
        "A2"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": true
    },
    {
      "id": "equipaje_general",
      "name": "Aduana/Equipaje (Todos Vuelos)",
      "time": "17:15-20:30",
      "minAgents": 2,
      "skills": [
        "A5"
      ],
      "critical": true,
      "pool": "traffic",
      "requiresBag": false,
      "shared": true,
      "area": "aduana"
    },
    {
      "id": "supervisor_control",
      "name": "Supervisor Control",
      "time": "15:55-23:00",
      "minAgents": 1,
      "skills": [
        "C4"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    },
    {
      "id": "supervisor_caja",
      "name": "Supervisor Caja",
      "time": "15:55-23:00",
      "minAgents": 1,
      "skills": [
        "C1"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    },
    {
      "id": "supervisor_gate",
      "name": "Supervisor Gate",
      "time": "16:40-23:00",
      "minAgents": 1,
      "skills": [
        "C0"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    },
    {
      "id": "supervisor_s",
      "name": "Supervisor S",
      "time": "15:55-23:00",
      "minAgents": 1,
      "skills": [
        "C3"
      ],
      "critical": false,
      "pool": "supervisor",
      "multiAssign": true
    }
  ],
  "breakSlotsNormal": [
    {
      "time": "15:54-16:54",
      "start": 54,
      "max": 6,
      "blocked": false
    },
    {
      "time": "16:37-17:37",
      "start": 97,
      "max": 6,
      "blocked": false
    },
    {
      "time": "16:56-17:56",
      "start": 116,
      "max": 6,
      "blocked": false
    },
    {
      "time": "17:53-18:53",
      "start": 173,
      "max": 5,
      "blocked": false
    },
    {
      "time": "18:23-19:23",
      "start": 203,
      "max": 5,
      "blocked": false
    },
    {
      "time": "18:57-19:57",
      "start": 237,
      "max": 5,
      "blocked": false
    },
    {
      "time": "19:53-20:53",
      "start": 293,
      "max": 5,
      "blocked": false
    }
  ],
  "blockedBreakWindows": [
    {
      "start": 205,
      "end": 255,
      "reason": "Abordaje AF179"
    },
    {
      "start": 270,
      "end": 305,
      "reason": "Abordaje KL686"
    },
    {
      "start": 375,
      "end": 425,
      "reason": "Abordaje AF173"
    }
  ],
  "restrictions": {
    "agentNotAssignable": {
      "code": "AGENT_NOT_ASSIGNABLE",
      "msg": "Agente no disponible este día"
    },
    "agentHasBreak": {
      "code": "AGENT_HAS_BREAK",
      "msg": "Agente tiene descanso asignado"
    },
    "skillsInsufficient": {
      "code": "SKILLS_INSUFFICIENT",
      "msg": "Agente no tiene los skills requeridos"
    },
    "recibeEmbarqueExclusion": {
      "code": "RECIBE_EMBARQUE_EXCLUSION",
      "msg": "Regla: Recibe ↔ Embarque son excluyentes"
    },
    "embarqueLimit": {
      "code": "EMBARQUE_LIMIT",
      "msg": "Máximo 2 embarques por agente"
    },
    "courseShiftEnd": {
      "code": "COURSE_SHIFT_END",
      "msg": "Regla: Agente excede su hora de salida (curso/22:00)"
    },
    "shiftEnd": {
      "code": "SHIFT_END",
      "msg": "Regla: La posición excede la hora de salida del agente"
    },
    "observacionRestricted": {
      "code": "OBSERVACION_RESTRICTED",
      "msg": "Regla: Observación solo mostradores economy/priority"
    },
    "timeConflict": {
      "code": "TIME_CONFLICT",
      "msg": "Conflicto de horario con posición actual"
    },
    "sequenceLimit": {
      "code": "SEQUENCE_LIMIT",
      "msg": "Regla: máximo 2 días consecutivos en el mismo tipo de asignación"
    },
    "quioscoNoConsecutive": {
      "code": "QUIOSCO_NO_CONSECUTIVE",
      "msg": "Regla: no se permite asignación consecutiva a Quiosco"
    },
    "aduanaIsolated": {
      "code": "ADUANA_ISOLATED",
      "msg": "Regla: Aduanas es independiente (no se comparte con ninguna otra asignación)"
    },
    "klmDedicated": {
      "code": "KLM_DEDICATED",
      "msg": "Regla: KLM requiere agentes dedicados (sin otras asignaciones)"
    },
    "boardingToCounterForbidden": {
      "code": "BOARDING_TO_COUNTER_FORBIDDEN",
      "msg": "Regla: no se permite movimiento de Abordaje a Mostrador"
    },
    "criticalSharingForbidden": {
      "code": "CRITICAL_SHARING_FORBIDDEN",
      "msg": "Regla: no se permite compartir agentes entre asignaciones críticas"
    },
    "lobyOnlyForbidden": {
      "code": "LOBY_ONLY_FORBIDDEN",
      "msg": "Regla: Loby/Preparar Mostradores no puede ser la única función del agente"
    },
    "diegoAssignmentBlocked": {
      "code": "DIEGO_ASSIGNMENT_BLOCKED",
      "msg": "Regla: Supervisor Diego solo puede estar Observando (sin asignación operativa)"
    },
    "breakSlotBlocked": {
      "code": "BREAK_SLOT_BLOCKED",
      "msg": "Slot bloqueado (ventana de embarque)"
    },
    "breakDuringBoarding": {
      "code": "BREAK_DURING_BOARDING",
      "msg": "Regla: descanso durante ventana de embarque"
    },
    "breakOverlapsCritical": {
      "code": "BREAK_OVERLAPS_CRITICAL",
      "msg": "Regla: descanso se solapa con posición crítica"
    },
    "breakRequiredAduana": {
      "code": "BREAK_REQUIRED_ADUANA",
      "msg": "Regla: Aduana requiere descanso programado antes de la operación"
    },
    "breakWindowAduana": {
      "code": "BREAK_WINDOW_ADUANA",
      "msg": "Regla: break de Aduana debe terminar antes del inicio de operación/servicio"
    }
  },
  "agentes": [
    {
      "id": "2000467",
      "nombre": "CRUZ MEJIA ELIZABETH",
      "name": "Elizabeth Cruz",
      "tipo": "traffic",
      "descansos": "Dom-Lun",
      "cumple": "03/05",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          0,
          1
        ]
      }
    },
    {
      "id": "2000469",
      "nombre": "PEÑA CRUZ KATIA CELINA",
      "name": "Katia Peña",
      "tipo": "traffic",
      "descansos": "Dom-Lun",
      "cumple": "24/06",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          0,
          1
        ]
      }
    },
    {
      "id": "2000477",
      "nombre": "RIVERA HERNANDEZ THANIA",
      "name": "Thania Rivera",
      "tipo": "traffic",
      "descansos": "Dom-Lun",
      "cumple": "17/01",
      "skills": {
        "A2": 0.5,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          0,
          1
        ]
      }
    },
    {
      "id": "2000587",
      "nombre": "BECERRIL VEGA ALEJANDRA",
      "name": "Alejandra Becerril",
      "tipo": "traffic",
      "descansos": "Dom-Lun",
      "cumple": "04/03",
      "skills": {
        "A2": 0.5,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "cambiosDescanso": [
        {
          "desde": "2026-05-18",
          "descansos": "Mar-Mié",
          "diasDescanso": [
            2,
            3
          ]
        }
      ],
      "notas": [
        {
          "texto": "⚠️ Esta semana cambia su patrón de descansos de Dom-Lun a Mar-Mié",
          "tipo": "alerta",
          "icono": "⚠️",
          "desde": "2026-05-18",
          "hasta": "2026-05-24"
        }
      ],
      "descansoPatron": {
        "diasDescanso": [
          0,
          1
        ]
      }
    },
    {
      "id": "2000609",
      "nombre": "BUTANDA MENDOZA TANIA JOHANA",
      "name": "Tania Butanda",
      "tipo": "traffic",
      "descansos": "Lun-Mar",
      "cumple": "27/09",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 1,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          1,
          2
        ]
      }
    },
    {
      "id": "2000675",
      "nombre": "FERNANDA GALVEZ",
      "name": "Fernanda Galvez",
      "tipo": "traffic",
      "descansos": "Lun-Mar",
      "cumple": null,
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          1,
          2
        ]
      }
    },
    {
      "id": "2000475",
      "nombre": "TADDEI SANTIAGO FRIDA ALESSIA",
      "name": "Alessia Taddei",
      "tipo": "traffic",
      "descansos": "Lun-Mar",
      "cumple": "03/10",
      "skills": {
        "A2": 0.5,
        "A1": 1,
        "A0": 1,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          1,
          2
        ]
      }
    },
    {
      "id": "2000707",
      "nombre": "SOLARES ORTEGA LILIANA",
      "name": "Liliana Solares",
      "tipo": "traffic",
      "descansos": "Lun-Mar",
      "cumple": null,
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          1,
          2
        ]
      }
    },
    {
      "id": "2000682",
      "nombre": "MORENO OCEGUERA ALMA FERNANADA",
      "name": "Fernanda Moreno",
      "tipo": "traffic",
      "descansos": "Mar-Mié",
      "cumple": "01/01",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.75,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000673",
      "nombre": "MORENO OCEGUERA FATIMA BERENICE",
      "name": "Fatima Moreno",
      "tipo": "traffic",
      "descansos": "Mar-Mié",
      "cumple": "25/10",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 1,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000674",
      "nombre": "JURADO TRACHUELO KENJI SANTIAGO",
      "name": "Kenji Jurado",
      "tipo": "traffic",
      "descansos": "Mar-Mié",
      "cumple": "02/01",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000704",
      "nombre": "RIVERA GONZALEZ DYLAN IZZIEL",
      "name": "Dylan Rivera",
      "tipo": "traffic",
      "descansos": "Mié-Jue",
      "cumple": "01/07",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000706",
      "nombre": "SALINAS CONTRERAS KAROL ANTONIO",
      "name": "Karol Salinas",
      "tipo": "traffic",
      "descansos": "Vie-Sáb",
      "cumple": "20/05",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          5,
          6
        ]
      }
    },
    {
      "id": "2000701",
      "nombre": "LEDEZMA MEJIA ANGEL VIDAL",
      "name": "Angel Ledezma",
      "tipo": "traffic",
      "descansos": "Mié-Jue",
      "cumple": "17/05",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000683",
      "nombre": "HERNANDEZ CRUZ JANETH SILVANA",
      "name": "Janeth Hernandez",
      "tipo": "traffic",
      "descansos": "Mié-Jue",
      "cumple": "15/02",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 1,
        "A5": 0,
        "A3": 1
      },
      "cambiosDescanso": [
        {
          "desde": "2026-05-18",
          "descansos": "Vie-Sáb",
          "diasDescanso": [
            5,
            6
          ]
        }
      ],
      "notas": [
        {
          "texto": "⚠️ Esta semana cambia su patrón de descansos de Mié-Jue a Vie-Sáb",
          "tipo": "alerta",
          "icono": "⚠️",
          "desde": "2026-05-18",
          "hasta": "2026-05-24"
        }
      ],
      "descansoPatron": {
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000677",
      "nombre": "MORALES BELMAN LUIS REY",
      "name": "Rey Belman",
      "tipo": "traffic",
      "descansos": "Mié-Jue",
      "cumple": "28/04",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.5,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000681",
      "nombre": "GUZMAN ARMENTA AILIN MONSERRAT",
      "name": "Monserrat Guzman",
      "tipo": "traffic",
      "descansos": "Jue-Vie",
      "cumple": "15/11",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 0.75,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          4,
          5
        ]
      }
    },
    {
      "id": "2000734",
      "nombre": "SANCHEZ GALICIA JONATHAN",
      "name": "Jonathan Sánchez",
      "tipo": "traffic",
      "descansos": "Dom-Lun",
      "cumple": "17/07",
      "skills": {
        "A2": 0.75,
        "A1": 0.5,
        "A0": 0.25,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          0,
          1
        ]
      }
    },
    {
      "id": "2000536",
      "nombre": "ANAYA DUARTE MIRIAM ESTEFANIA",
      "name": "Miriam Anaya",
      "tipo": "traffic",
      "descansos": "Jue-Vie",
      "cumple": "28/10",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          4,
          5
        ]
      }
    },
    {
      "id": "2000549",
      "nombre": "HERREJON MARTINEZ ROBERTO MITCHEL",
      "name": "Mitchel Herrejon",
      "tipo": "traffic",
      "descansos": "Vie-Sáb",
      "cumple": "18/02",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          5,
          6
        ]
      }
    },
    {
      "id": "2000544",
      "nombre": "ESTRADA GARCÍA FERNANDO EUGENIO",
      "name": "Fernando Estrada",
      "tipo": "traffic",
      "descansos": "Vie-Sáb",
      "cumple": "13/12",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          5,
          6
        ]
      }
    },
    {
      "id": "2000718",
      "nombre": "FRAGA GARCIA NADIA ILEANA",
      "name": "Nadia Fraga",
      "tipo": "traffic",
      "descansos": "Mié-Jue",
      "cumple": "04/07",
      "skills": {
        "A2": 0.5,
        "A1": 0.25,
        "A0": 0.25,
        "A5": 0.5,
        "A3": 0.75
      },
      "cambiosDescanso": [
        {
          "desde": "2026-05-18",
          "descansos": "Jue-Vie",
          "diasDescanso": [
            4,
            5
          ]
        }
      ],
      "notas": [
        {
          "texto": "⚠️ Esta semana cambia su patrón de descansos de Mié-Jue a Jue-Vie",
          "tipo": "alerta",
          "icono": "⚠️",
          "desde": "2026-05-18",
          "hasta": "2026-05-24"
        }
      ],
      "descansoPatron": {
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000676",
      "nombre": "LOPEZ LAZCANO RODRIGO",
      "name": "Rodrigo Lopez",
      "tipo": "traffic",
      "descansos": "Vie-Sáb",
      "cumple": "30/11",
      "skills": {
        "A2": 0,
        "A1": 0,
        "A0": 0,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          5,
          6
        ]
      }
    },
    {
      "id": "2000607",
      "nombre": "GARCIA FIGUEROA ARGELIA CRISTINA",
      "name": "Argelia Garcia",
      "tipo": "traffic",
      "descansos": "Vie-Sáb",
      "cumple": "01/09",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 0.25,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          5,
          6
        ]
      }
    },
    {
      "id": "2000472",
      "nombre": "JIMENEZ NAVARRO LESLIE ENRIQUETA",
      "name": "Leslie Jimenez",
      "tipo": "traffic",
      "descansos": "Sáb-Dom",
      "cumple": "07/11",
      "skills": {
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 0.25,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          6,
          0
        ]
      }
    },
    {
      "id": "2000588",
      "nombre": "JUAREZ FLORES ANEL CRISTINA",
      "name": "Anel Juarez",
      "tipo": "traffic",
      "descansos": "Sáb-Dom",
      "cumple": "15/03",
      "skills": {
        "A2": 0.5,
        "A1": 0.5,
        "A0": 1,
        "A5": 0,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          6,
          0
        ]
      }
    },
    {
      "id": "2000470",
      "nombre": "MORFIN PEREZ ALEJANDRO",
      "name": "Alejandro Morfin",
      "tipo": "traffic",
      "descansos": "Sáb-Dom",
      "cumple": "08/03",
      "skills": {
        "A2": 0.75,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          6,
          0
        ]
      }
    },
    {
      "id": "2000708",
      "nombre": "MORALES PALMA MAURICIO",
      "name": "Mauricio Morales",
      "tipo": "traffic",
      "descansos": "Jue-Vie",
      "cumple": "07/07",
      "skills": {
        "A2": 0.5,
        "A1": 0.25,
        "A0": 0.5,
        "A5": 1,
        "A3": 0.5
      },
      "descansoPatron": {
        "diasDescanso": [
          4,
          5
        ]
      }
    },
    {
      "id": "2000185",
      "nombre": "ERIBAN VALENCIA MORALES",
      "name": "Eriban Morales",
      "tipo": "traffic",
      "descansos": "Sáb-Dom",
      "cumple": "15/09",
      "skills": null,
      "wfmExcluded": true,
      "descansoPatron": {
        "diasDescanso": [
          6,
          0
        ]
      }
    },
    {
      "id": "2000562",
      "nombre": "ULIBARRI GUERRERO KARINA ITZEL",
      "name": "Karina Ulibarri",
      "tipo": "traffic",
      "descansos": "Sáb-Dom",
      "cumple": "08/05",
      "skills": null,
      "wfmExcluded": true,
      "descansoPatron": {
        "diasDescanso": [
          6,
          0
        ]
      }
    },
    {
      "id": "2000788",
      "nombre": "VAZQUEZ CRUZ ALEJANDRO",
      "name": "Alejandro Vázquez",
      "tipo": "traffic",
      "descansos": "Mar-Mié",
      "cumple": "07/02",
      "skills": {
        "A2": 0.25,
        "A1": 0.25,
        "A0": 0.25,
        "A5": 0.25,
        "A3": 0.5
      },
      "descansoPatron": {
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000789",
      "nombre": "GARCIA ESTRADA CASANDRA VANESSA",
      "name": "Cassandra García",
      "tipo": "traffic",
      "descansos": "Mar-Mié",
      "cumple": "30/03",
      "skills": {
        "A2": 0.25,
        "A1": 0.25,
        "A0": 0.75,
        "A5": 0.25,
        "A3": 0.5
      },
      "descansoPatron": {
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000790",
      "nombre": "GAMA MENDOZA ALAN",
      "name": "Alan Gama",
      "tipo": "traffic",
      "descansos": "Jue-Vie",
      "cumple": "26/03",
      "skills": {
        "A2": 0.75,
        "A1": 0.75,
        "A0": 0.75,
        "A5": 0.75,
        "A3": 0.75
      },
      "wfmWeekendExcluded": true,
      "descansoPatron": {
        "diasDescanso": [
          4,
          5
        ]
      }
    },
    {
      "id": "2000191",
      "nombre": "GOMEZ SANCHEZ ALDO GABRIEL",
      "name": "Aldo Gomez",
      "tipo": "supervisor",
      "descansos": "Mar-Mié",
      "cumple": "04/06",
      "skills": {
        "C4": 1,
        "C1": 1,
        "C0": 1,
        "C3": 1,
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000545",
      "nombre": "GALVAN PRIETO DANIELA",
      "name": "Daniela Galván",
      "tipo": "supervisor",
      "descansos": "Mié-Jue",
      "cumple": "18/09",
      "skills": {
        "C4": 1,
        "C1": 1,
        "C0": 1,
        "C3": 1,
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000462",
      "nombre": "AGUILAR GUERRERO BRENDA LORENA",
      "name": "Lorena Aguilar",
      "tipo": "supervisor",
      "descansos": "Jue-Vie",
      "cumple": "09/09",
      "skills": {
        "C4": 1,
        "C1": 1,
        "C0": 1,
        "C3": 1,
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          4,
          5
        ]
      }
    },
    {
      "id": "2000566",
      "nombre": "SERRANO ARENAS DAVID EDUARDO",
      "name": "David Serrano",
      "tipo": "supervisor",
      "descansos": "Vie-Sáb",
      "cumple": "05/10",
      "skills": {
        "C4": 1,
        "C1": 1,
        "C0": 1,
        "C3": 1,
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          5,
          6
        ]
      }
    },
    {
      "id": "2000567",
      "nombre": "MORALES FERNANDEZ DIANA KAREN",
      "name": "Karen Morales",
      "tipo": "supervisor",
      "descansos": "Dom-Lun",
      "cumple": "13/11",
      "skills": {
        "C4": 1,
        "C1": 1,
        "C0": 1,
        "C3": 1,
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          0,
          1
        ]
      }
    },
    {
      "id": "2000787",
      "nombre": "LOPEZ ONTIVEROS DIEGO",
      "name": "Diego López",
      "tipo": "supervisor",
      "descansos": "Lun-Mar",
      "cumple": "25/09",
      "skills": {
        "C4": 1,
        "C1": 1,
        "C0": 1,
        "C3": 1,
        "A2": 1,
        "A1": 1,
        "A0": 1,
        "A5": 1,
        "A3": 1
      },
      "descansoPatron": {
        "diasDescanso": [
          1,
          2
        ]
      }
    },
    {
      "id": "2000796",
      "nombre": "CEDEÑO LEÓN VICTOR MANUEL",
      "name": "Victor Cedeño",
      "tipo": "traffic",
      "descansos": "Mar-Mie",
      "cumple": "20/01",
      "skills": {
        "A2": 0,
        "A1": 0,
        "A0": 0,
        "A5": 0,
        "A3": 0.5
      },
      "descansoPatron": {
        "tipo": "ciclo",
        "diasDescanso": [
          2,
          3
        ]
      }
    },
    {
      "id": "2000799",
      "nombre": "DURAN FIGUEROA AZUCENA MINERVA",
      "name": "Azucena Duran",
      "tipo": "traffic",
      "descansos": "Mie-Jue",
      "cumple": "26/04",
      "skills": {
        "A2": 0,
        "A1": 0,
        "A0": 0,
        "A5": 0,
        "A3": 0.5
      },
      "descansoPatron": {
        "tipo": "ciclo",
        "diasDescanso": [
          3,
          4
        ]
      }
    },
    {
      "id": "2000800",
      "nombre": "GARCIA LICONA CARLOS UBALDO",
      "name": "Ubaldo García",
      "tipo": "traffic",
      "descansos": "Lun-Mar",
      "cumple": "20/08",
      "skills": {
        "A2": 0,
        "A1": 0,
        "A0": 0,
        "A5": 0,
        "A3": 0.5
      },
      "descansoPatron": {
        "tipo": "ciclo",
        "diasDescanso": [
          1,
          2
        ]
      }
    }
  ],
  "wfmExcludedIds": [
    "2000185",
    "2000562"
  ],
  "special": {
    "diegoId": "2000787",
    "alejandroVId": "2000788",
    "cassandraId": "2000789"
  },
  "incapacidades": [
    {
      "id": "2000708",
      "nota": "Agente no se presenta a servicio.",
      "mes": 5,
      "diaInicio": 4,
      "diaFin": 31
    },
    {
      "id": "2000676",
      "nota": "Agente no se presenta a servicio.",
      "mes": 5,
      "diaInicio": 12,
      "diaFin": 18
    },
    {
      "id": "2000676",
      "nota": "Agente no se presenta a servicio.",
      "mes": 5,
      "diaInicio": 7,
      "diaFin": 12
    },
    {
      "id": "2000708",
      "nota": "Agente no se presenta a servicio.",
      "mes": 6,
      "diaInicio": 1,
      "diaFin": 1
    }
  ],
  "permisoEntradaTarde": [],
  "permisoSinGoce": [
    {
      "id": "2000462",
      "nota": "Agente no se presenta a servicio.",
      "mes": 5,
      "dia": 16
    }
  ],
  "cursosAduana": [],
  "descansosAjuste": [],
  "descansoLaborado": [],
  "observacionPeriodos": [],
  "permutas": [
    {
      "id1": "2000790",
      "nombre1": "Alan Gama",
      "id2": "2000562",
      "nombre2": "Karina Ulibarri",
      "id1_trabaja": 29,
      "id1_trabaja_mes": 5,
      "id1_descansa": 17,
      "id1_descansa_mes": 5,
      "id2_trabaja": 17,
      "id2_trabaja_mes": 5,
      "id2_descansa": 29,
      "id2_descansa_mes": 5,
      "mes": 5
    },
    {
      "id1": "2000718",
      "nombre1": "Nadia Fraga",
      "id2": "2000790",
      "nombre2": "Alan Gama",
      "id1_trabaja": 13,
      "id1_trabaja_mes": 5,
      "id1_descansa": 15,
      "id1_descansa_mes": 5,
      "id2_trabaja": 15,
      "id2_trabaja_mes": 5,
      "id2_descansa": 13,
      "id2_descansa_mes": 5,
      "mes": 5
    },
    {
      "id1": "2000718",
      "nombre1": "Nadia Fraga",
      "id2": "2000734",
      "nombre2": "Jonathan Sánchez",
      "id1_trabaja": 22,
      "id1_trabaja_mes": 5,
      "id1_descansa": 17,
      "id1_descansa_mes": 5,
      "id2_trabaja": 17,
      "id2_trabaja_mes": 5,
      "id2_descansa": 22,
      "id2_descansa_mes": 5,
      "mes": 5
    },
    {
      "id1": "2000677",
      "nombre1": "Rey Belman",
      "id2": "2000707",
      "nombre2": "Liliana Solares",
      "id1_trabaja": 20,
      "id1_trabaja_mes": 5,
      "id1_descansa": 18,
      "id1_descansa_mes": 5,
      "id2_trabaja": 18,
      "id2_trabaja_mes": 5,
      "id2_descansa": 20,
      "id2_descansa_mes": 5,
      "mes": 5
    }
  ],
  "cursosRecurrentes": [],
  "onboardingSchedule": []
};
