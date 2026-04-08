/* ═══════════════════════════════════════════════════════════
   Valerie's Schedule — app logic
   All in plain JS, no dependencies.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────
  // Storage (safe wrappers — Safari private mode can throw)
  // ─────────────────────────────────────────────────────────
  const KEY_SCHED = 'valerie-schedule-v1';
  const KEY_MS    = 'valerie-milestones-v1';
  const KEY_SET   = 'valerie-settings-v1';

  function lsGet(k) {
    try { return JSON.parse(localStorage.getItem(k)); }
    catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }

  // ─────────────────────────────────────────────────────────
  // Defaults
  // ─────────────────────────────────────────────────────────
  const mm = (h, m) => h * 60 + m;

  const DEFAULT_SCHEDULE = {
    version: 1,
    events: [
      { id: 'e1', time: mm(7, 30),  label: 'Wake up & feed', kind: 'wake'  },
      { id: 'e2', time: mm(9, 30),  label: 'Feed',           kind: 'feed'  },
      { id: 'e3', time: mm(10, 0),  label: 'Down for nap',   kind: 'nap'   },
      { id: 'e4', time: mm(12, 30), label: 'Feed',           kind: 'feed'  },
      { id: 'e5', time: mm(13, 0),  label: 'Down for nap',   kind: 'nap'   },
      { id: 'e6', time: mm(14, 30), label: 'Feed',           kind: 'feed'  },
      { id: 'e7', time: mm(15, 0),  label: 'Awake & play',   kind: 'wake'  },
      { id: 'e8', time: mm(16, 0),  label: 'Down for nap',   kind: 'nap'   },
      { id: 'e9', time: mm(17, 0),  label: 'Feed',           kind: 'feed'  },
      { id: 'e10',time: mm(18, 30), label: 'Bath',           kind: 'bath'  },
      { id: 'e11',time: mm(19, 0),  label: 'Feed & bedtime', kind: 'sleep' },
    ],
  };

  const DEFAULT_SETTINGS = {
    version: 1,
    babyName: 'Valerie',
    birthDate: '2025-12-10',
    microActivityWindowMin: 40,
  };

  // ─────────────────────────────────────────────────────────
  // Kind config — colors + icons
  // ─────────────────────────────────────────────────────────
  const KINDS = {
    wake:  { label: 'Wake',  icon: '☼', accent: '#E87FA3', deep: '#D85C87', bgLight: '#FCE4EE', bgDark: '#5A2E42', macro: true  },
    feed:  { label: 'Feed',  icon: '♡', accent: '#F4A8B8', deep: '#E389A0', bgLight: '#FDEEF2', bgDark: '#4E2636', macro: false },
    nap:   { label: 'Nap',   icon: '☾', accent: '#A786D1', deep: '#9778C2', bgLight: '#EFE7F7', bgDark: '#3A2A52', macro: true  },
    bath:  { label: 'Bath',  icon: '✿', accent: '#7FB8D4', deep: '#5F9BBD', bgLight: '#E5F1F8', bgDark: '#1F3A4A', macro: true  },
    sleep: { label: 'Sleep', icon: '✦', accent: '#8B6FB0', deep: '#7458A0', bgLight: '#E8DEF0', bgDark: '#2E1E3F', macro: true  },
  };
  const KIND_LIST = ['wake', 'feed', 'nap', 'bath', 'sleep'];

  // Human-readable phase names (what "Right now" shows)
  const PHASE_NAMES = {
    wake:  'Awake',
    nap:   'Napping',
    bath:  'Bath time',
    sleep: 'Sleeping',
  };

  // Which kinds "break" a phase (kick the baby into a new phase)
  const MACRO_KINDS = new Set(['wake', 'nap', 'bath', 'sleep']);

  // ─────────────────────────────────────────────────────────
  // Wonder Weeks leaps — 10 leaps, canonical week numbers,
  // descriptions + milestones in plain English
  // ─────────────────────────────────────────────────────────
  const LEAPS = [
    {
      week: 5,  name: 'World of Changing Sensations',
      desc: 'Her senses are waking up. Everything feels louder, brighter, new.',
      milestones: [
        { id: 'l1.track',    text: 'Tracks faces and objects with her eyes'      },
        { id: 'l1.smile',    text: 'First real social smile'                     },
        { id: 'l1.listen',   text: 'Turns toward a familiar voice'               },
        { id: 'l1.tears',    text: 'Starts crying actual tears'                  },
        { id: 'l1.study',    text: 'Stares longer at patterns and contrasts'    },
      ],
    },
    {
      week: 8,  name: 'World of Patterns',
      desc: 'She notices repeating shapes — hands, light, stripes, her own fingers.',
      milestones: [
        { id: 'l2.hands',    text: 'Discovers her own hands'                     },
        { id: 'l2.vowels',   text: 'Coos and makes new vowel sounds'             },
        { id: 'l2.head',     text: 'Lifts head when on tummy'                    },
        { id: 'l2.mirror',   text: 'Stares at her reflection'                    },
        { id: 'l2.grasp',    text: 'Grasps a finger tightly'                     },
        { id: 'l2.shadow',   text: 'Fascinated by light and shadow'              },
      ],
    },
    {
      week: 12, name: 'World of Smooth Transitions',
      desc: 'Her movements smooth out. She can follow things, grab things, giggle at things.',
      milestones: [
        { id: 'l3.reach',    text: 'Reaches for a toy with purpose'              },
        { id: 'l3.laugh',    text: 'Laughs out loud when tickled'                },
        { id: 'l3.turn',     text: 'Turns her head in every direction'           },
        { id: 'l3.voice',    text: 'Plays with pitch and volume of her voice'    },
        { id: 'l3.raspberry',text: 'Blows raspberries'                           },
        { id: 'l3.weight',   text: 'Bears weight on her legs when held up'       },
      ],
    },
    {
      week: 19, name: 'World of Events',
      desc: 'She sees that one thing leads to another. Cause and effect click into place.',
      milestones: [
        { id: 'l4.roll',     text: 'Rolls from back to tummy'                    },
        { id: 'l4.mouth',    text: 'Puts everything in her mouth'                },
        { id: 'l4.name',     text: 'Turns when you say her name'                 },
        { id: 'l4.babble',   text: 'Babbles with consonants (ba, da, ga)'        },
        { id: 'l4.reach2',   text: 'Grabs and passes toys hand to hand'          },
        { id: 'l4.impatient',text: 'Impatient when food is slow to arrive'       },
        { id: 'l4.mirror',   text: 'Laughs at herself in the mirror'             },
      ],
    },
    {
      week: 26, name: 'World of Relationships',
      desc: 'She understands distance — how things relate, how far "away" is, and that she misses you.',
      milestones: [
        { id: 'l5.sit',      text: 'Sits up on her own (briefly at first)'       },
        { id: 'l5.drop',     text: 'Drops things to watch them fall'             },
        { id: 'l5.crawl',    text: 'First attempts at crawling or scooting'      },
        { id: 'l5.shy',      text: 'Shy or clingy with strangers'                },
        { id: 'l5.no',       text: 'Understands the word "no"'                   },
        { id: 'l5.hide',     text: 'Looks for a hidden object (peek-a-boo!)'     },
      ],
    },
    {
      week: 37, name: 'World of Categories',
      desc: 'She sorts the world into groups — dogs, food, shoes. She notices what is alike.',
      milestones: [
        { id: 'l6.sort',     text: 'Sorts objects by shape or color'             },
        { id: 'l6.imitate',  text: 'Imitates actions (waving, clapping)'         },
        { id: 'l6.crawl',    text: 'Crawls confidently'                          },
        { id: 'l6.pull',     text: 'Pulls herself up to standing'                },
        { id: 'l6.point',    text: 'Points at things she wants'                  },
        { id: 'l6.jealous',  text: 'Shows the first signs of jealousy'           },
      ],
    },
    {
      week: 46, name: 'World of Sequences',
      desc: 'She learns that things happen in an order. First this, then that.',
      milestones: [
        { id: 'l7.stack',    text: 'Stacks or nests objects'                     },
        { id: 'l7.step',     text: 'Takes her first steps'                       },
        { id: 'l7.word',     text: 'Says her first clear word'                   },
        { id: 'l7.peek',     text: 'Plays peek-a-boo and laughs at it'           },
        { id: 'l7.tool',     text: 'Uses objects for their real purpose'         },
        { id: 'l7.follow',   text: 'Follows a simple two-step instruction'       },
      ],
    },
    {
      week: 55, name: 'World of Programs',
      desc: 'She strings sequences into routines — meals, bedtime, getting dressed.',
      milestones: [
        { id: 'l8.walk',     text: 'Walks steadily on her own'                   },
        { id: 'l8.feed',     text: 'Feeds herself with a spoon'                  },
        { id: 'l8.help',     text: 'Tries to help dress herself'                 },
        { id: 'l8.chore',    text: 'Imitates household tasks'                    },
        { id: 'l8.words',    text: 'Uses several words meaningfully'             },
      ],
    },
    {
      week: 64, name: 'World of Principles',
      desc: 'She discovers she has a will — and tests it. Rules, negotiation, big feelings.',
      milestones: [
        { id: 'l9.no',       text: 'Says "no" (and means it)'                    },
        { id: 'l9.tantrum',  text: 'First real tantrums'                         },
        { id: 'l9.negotiate',text: 'Tries to negotiate or bargain'               },
        { id: 'l9.empathy',  text: 'Comforts someone who seems sad'              },
        { id: 'l9.emotion',  text: 'Mimics emotions on purpose'                  },
      ],
    },
    {
      week: 75, name: 'World of Systems',
      desc: 'She sees herself as part of a bigger system — family, friends, rules, values.',
      milestones: [
        { id: 'l10.pretend', text: 'Pretend play (tea, phone, dolls)'            },
        { id: 'l10.rules',   text: 'Starts following simple rules'               },
        { id: 'l10.friend',  text: 'Calls another child her friend'              },
        { id: 'l10.self',    text: 'Talks about herself by name'                 },
        { id: 'l10.empathy', text: 'Shows real empathy'                          },
      ],
    },
  ];

  // ─────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────
  let schedule = loadSchedule();
  let settings = loadSettings();
  let milestones = loadMilestones();
  let viewLeapIdx = null; // which leap the user is currently viewing

  function loadSchedule() {
    const raw = lsGet(KEY_SCHED);
    if (raw && raw.version === 1 && Array.isArray(raw.events) && raw.events.length) {
      return { version: 1, events: raw.events.map(normalizeEvent).filter(Boolean).sort(byTime) };
    }
    return structuredCloneSafe(DEFAULT_SCHEDULE);
  }

  function loadSettings() {
    const raw = lsGet(KEY_SET);
    if (raw && raw.version === 1) {
      return Object.assign({}, DEFAULT_SETTINGS, raw);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function loadMilestones() {
    const raw = lsGet(KEY_MS);
    if (raw && raw.version === 1 && raw.checked && typeof raw.checked === 'object') {
      return { version: 1, checked: Object.assign({}, raw.checked) };
    }
    return { version: 1, checked: {} };
  }

  function saveSchedule() { lsSet(KEY_SCHED, schedule); }
  function saveSettings() { lsSet(KEY_SET, settings); }
  function saveMilestones() { lsSet(KEY_MS, milestones); }

  function structuredCloneSafe(o) { return JSON.parse(JSON.stringify(o)); }
  function byTime(a, b) { return a.time - b.time; }

  function normalizeEvent(e) {
    if (!e || typeof e !== 'object') return null;
    const time = Number(e.time);
    if (!Number.isFinite(time) || time < 0 || time > 1439) return null;
    const label = typeof e.label === 'string' ? e.label.trim() : '';
    if (!label) return null;
    const kind = KIND_LIST.includes(e.kind) ? e.kind : 'wake';
    const id = typeof e.id === 'string' && e.id ? e.id : newId();
    return { id, time: Math.round(time), label, kind };
  }

  let _idCounter = 0;
  function newId() {
    _idCounter++;
    return 'e' + Date.now().toString(36) + _idCounter.toString(36);
  }

  // ─────────────────────────────────────────────────────────
  // Time / formatting helpers
  // ─────────────────────────────────────────────────────────
  function fmtTime(mins) {
    mins = ((Math.round(mins) % 1440) + 1440) % 1440;
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const h12 = ((h24 + 11) % 12) + 1;
    const ap = h24 < 12 ? 'am' : 'pm';
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }

  function fmtDuration(mins) {
    mins = Math.max(0, Math.round(mins));
    if (mins < 1) return 'any moment';
    if (mins === 1) return '1 minute';
    if (mins < 60) return mins + ' minutes';
    const h = Math.floor(mins / 60), m = mins % 60;
    if (m === 0) return h === 1 ? '1 hour' : h + ' hours';
    return h + ' hr ' + m + ' min';
  }

  function currentMinutes() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  // ─────────────────────────────────────────────────────────
  // Age calculation (calendar-accurate)
  // ─────────────────────────────────────────────────────────
  function parseDateLocal(s) {
    // 'YYYY-MM-DD' parsed as local date (not UTC)
    if (!s || typeof s !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function ageInfo(birthStr) {
    const birth = parseDateLocal(birthStr);
    if (!birth) return null;
    const now = new Date();
    const ms = now - birth;
    if (ms < 0) return { weeks: 0, days: 0, months: 0, monthDays: 0, totalDays: 0, future: true };

    const totalDays = Math.floor(ms / 86400000);
    const weeks = Math.floor(totalDays / 7);
    const wDays = totalDays % 7;

    // Calendar months + remainder days
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    let anchor = new Date(birth.getFullYear(), birth.getMonth() + months, birth.getDate());
    if (anchor > now) {
      months--;
      anchor = new Date(birth.getFullYear(), birth.getMonth() + months, birth.getDate());
    }
    const monthDays = Math.floor((now - anchor) / 86400000);

    return { weeks, days: wDays, months, monthDays, totalDays, future: false };
  }

  function ageLine(info) {
    if (!info) return '';
    if (info.future) return 'not yet born';
    const mPart = info.months === 1 ? '1 month' : info.months + ' months';
    const dPart = info.monthDays === 1 ? '1 day' : info.monthDays + ' days';
    return '<b>' + info.weeks + '</b> weeks &middot; <b>' + mPart + '</b>, ' + dPart;
  }

  // ─────────────────────────────────────────────────────────
  // Phase derivation
  //
  // Model: build a 3-day timeline (yesterday / today / tomorrow), walk it once
  // to compute continuous "phase segments", then find the segment that
  // contains `now`. Phase segment rules:
  //
  //   - A wake / nap / bath / sleep event starts a new segment of that kind.
  //   - A feed event inside a wake segment continues wake (no new segment).
  //   - A feed event inside a nap or sleep segment implicitly wakes the baby
  //     and starts a new 'wake' segment (so "Nap" ends at the first feed,
  //     which is how parents actually think about the day).
  //
  // This fixes the case where "Down for nap" at 4pm was incorrectly being
  // reported as "Feed & bedtime" because the old backward-scan shifted
  // future events into yesterday and matched the wrong macro event.
  // ─────────────────────────────────────────────────────────
  function derivePhases(now) {
    const base = schedule.events.slice().sort(byTime);
    if (!base.length) return null;
    const N = base.length;

    // Build 3-day timeline: yesterday (-1440), today (0), tomorrow (+1440)
    const tl = [];
    const OFFSETS = [-1440, 0, 1440];
    for (let oi = 0; oi < OFFSETS.length; oi++) {
      const offset = OFFSETS[oi];
      for (let i = 0; i < N; i++) {
        tl.push({ event: base[i], time: base[i].time + offset });
      }
    }
    // Already sorted: each offset block is sorted and offsets are strictly
    // increasing by 1440 while event times are 0..1439, so the blocks don't
    // overlap.

    // Walk timeline and compute segments [{start, end, kind, label}]
    const segments = [];
    let cur = null;
    for (let i = 0; i < tl.length; i++) {
      const e = tl[i].event;
      const t = tl[i].time;
      let kind;
      if (MACRO_KINDS.has(e.kind)) {
        kind = e.kind;
      } else if (e.kind === 'feed') {
        if (cur && (cur.kind === 'nap' || cur.kind === 'sleep')) {
          kind = 'wake'; // implicit wake-up
        } else if (cur) {
          kind = cur.kind;
        } else {
          kind = 'wake';
        }
      } else {
        kind = 'wake';
      }

      if (!cur || cur.kind !== kind) {
        if (cur) cur.end = t;
        cur = { start: t, end: null, kind: kind, label: e.label, startEvent: e };
        segments.push(cur);
      } else if (MACRO_KINDS.has(e.kind) && e.kind === cur.kind) {
        // same-kind macro within an ongoing segment — refresh the label
        cur.label = e.label;
      }
    }
    if (cur && cur.end == null) cur.end = cur.start + 1440 * 3;

    // Find the segment containing now
    let segment = null;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].start <= now && now < segments[i].end) {
        segment = segments[i];
        break;
      }
    }
    if (!segment) segment = segments[segments.length - 1];

    // Most recent timeline entry ≤ now (for schedule list highlighting)
    let ci = -1;
    for (let i = tl.length - 1; i >= 0; i--) {
      if (tl[i].time <= now) { ci = i; break; }
    }
    if (ci === -1) ci = 0;
    const currentEntry = tl[ci];

    // Next timeline entry > now
    let nextEntry = null;
    for (let i = 0; i < tl.length; i++) {
      if (tl[i].time > now) { nextEntry = tl[i]; break; }
    }
    if (!nextEntry) nextEntry = tl[tl.length - 1];

    // Micro activity — most recent feed within the window minutes.
    // (We only show feeds as micro; bath is its own phase now.)
    let micro = null;
    const windowMin = settings.microActivityWindowMin || 40;
    for (let i = ci; i >= 0; i--) {
      const age = now - tl[i].time;
      if (age > windowMin) break;
      if (tl[i].event.kind === 'feed') {
        micro = { event: tl[i].event, start: tl[i].time, ageMin: age };
        break;
      }
    }

    // Which base-event index is "current today" for the schedule list.
    // Today block = indices [N, 2N).
    const todayStart = N, todayEnd = 2 * N;
    let currentBaseIdx = -1;
    if (ci >= todayStart && ci < todayEnd) currentBaseIdx = ci - todayStart;

    return {
      base: base,
      segment: segment,     // { start, end, kind, label }
      currentEvent: currentEntry.event,
      currentTime: currentEntry.time,
      nextEvent: nextEntry.event,
      nextTime: nextEntry.time,
      micro: micro,
      currentBaseIdx: currentBaseIdx,
    };
  }

  // ─────────────────────────────────────────────────────────
  // Theme sync (CSS vars + theme-color meta)
  // ─────────────────────────────────────────────────────────
  function applyKindAccent(kind) {
    const k = KINDS[kind] || KINDS.wake;
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const root = document.documentElement.style;
    root.setProperty('--accent', k.accent);
    root.setProperty('--accent-deep', k.deep);
    root.setProperty('--current-bg', dark ? k.bgDark : k.bgLight);
    const tc = document.getElementById('theme-color');
    if (tc) tc.setAttribute('content', dark ? k.bgDark : k.bgLight);
  }

  // ─────────────────────────────────────────────────────────
  // Render — top section (clock, age, now, next, schedule)
  // ─────────────────────────────────────────────────────────
  function render() {
    const now = currentMinutes();
    const phases = derivePhases(now);
    if (!phases) {
      renderEmptyState();
      return;
    }

    // Clock
    const d = new Date();
    document.getElementById('clock').textContent =
      d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

    // Brand name
    document.getElementById('brand-name').textContent = settings.babyName || 'Baby';

    // Age
    const info = ageInfo(settings.birthDate);
    document.getElementById('age-strip').innerHTML = ageLine(info);

    // Theme + phase name driven by current segment
    const seg = phases.segment;
    applyKindAccent(seg.kind);

    // Right-now: human phase name (Napping / Awake / Sleeping / Bath time)
    document.getElementById('now-name').textContent = PHASE_NAMES[seg.kind] || seg.label;

    const nowSub = document.getElementById('now-sub');
    if (phases.micro) {
      const mk = KINDS[phases.micro.event.kind];
      nowSub.innerHTML = mk.icon + '  currently <b>feeding</b>';
      nowSub.hidden = false;
    } else {
      nowSub.hidden = true;
    }

    // Meta line — until end of current segment
    const endTime = seg.end;
    const remain = endTime - now;
    const untilLabel = fmtTime(((endTime % 1440) + 1440) % 1440);
    document.getElementById('now-meta').innerHTML =
      'until <b>' + untilLabel + '</b> &middot; ' + fmtDuration(remain) + ' to go';

    // Progress bar
    const span = Math.max(1, endTime - seg.start);
    const pct = Math.min(100, Math.max(0, ((now - seg.start) / span) * 100));
    document.getElementById('progress-fill').style.width = pct + '%';

    // Up next
    const untilNext = phases.nextTime - now;
    document.getElementById('next-name').textContent = phases.nextEvent.label;
    const nextLabel = fmtTime(((phases.nextTime % 1440) + 1440) % 1440);
    document.getElementById('next-when').innerHTML =
      '<b>' + nextLabel + '</b> &middot; in ' + fmtDuration(untilNext);

    // Schedule list
    renderSchedule(phases);

    // Leap card
    renderLeap(info);
  }

  function renderEmptyState() {
    document.getElementById('now-name').textContent = 'No events yet';
    document.getElementById('now-sub').hidden = true;
    document.getElementById('now-meta').innerHTML = 'Open settings to add some &middot;';
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('next-name').textContent = '—';
    document.getElementById('next-when').textContent = '';
    document.getElementById('sched').innerHTML = '';
  }

  function renderSchedule(phases) {
    const sched = document.getElementById('sched');
    sched.innerHTML = '';
    const base = phases.base;
    const ciBase = phases.currentBaseIdx; // -1 if nothing today has happened yet

    base.forEach(function (e, bi) {
      const li = document.createElement('li');
      const isCurrent = ciBase >= 0 && bi === ciBase;
      const isPast = ciBase >= 0 && bi < ciBase;

      if (isPast) li.classList.add('past');
      if (isCurrent) li.classList.add('current');

      const k = KINDS[e.kind];
      const t = document.createElement('span');
      t.className = 't';
      t.textContent = fmtTime(e.time);

      const ico = document.createElement('span');
      ico.className = 'ico';
      ico.textContent = k.icon;
      ico.style.color = k.accent;

      const dot = document.createElement('span');
      dot.className = 'dot';
      if (!isPast && !isCurrent) dot.style.background = k.accent;

      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = e.label;

      li.append(t, ico, dot, lbl);

      // Long-press to edit this event
      attachLongPress(li, function () {
        openSettings();
        requestAnimationFrame(function () {
          const row = document.querySelector('[data-eid="' + e.id + '"]');
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = row.querySelector('input[type="text"]');
            if (input) setTimeout(function () { input.focus(); }, 350);
          }
        });
      });

      sched.appendChild(li);
    });
  }

  function attachLongPress(el, handler) {
    let timer = null;
    let moved = false;
    const start = function (e) {
      moved = false;
      timer = setTimeout(function () {
        if (!moved) {
          if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
          handler();
        }
      }, 520);
    };
    const cancel = function () {
      if (timer) { clearTimeout(timer); timer = null; }
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove',  function () { moved = true; cancel(); }, { passive: true });
    el.addEventListener('touchend',   cancel);
    el.addEventListener('touchcancel',cancel);
    el.addEventListener('mousedown',  start);
    el.addEventListener('mousemove',  function () { moved = true; cancel(); });
    el.addEventListener('mouseup',    cancel);
    el.addEventListener('mouseleave', cancel);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─────────────────────────────────────────────────────────
  // Leap card rendering
  // ─────────────────────────────────────────────────────────
  function currentLeapIdx(info) {
    if (!info || info.future) return 0;
    let idx = 0;
    for (let i = 0; i < LEAPS.length; i++) {
      if (LEAPS[i].week <= info.weeks) idx = i;
    }
    return idx;
  }

  function renderLeap(info) {
    const curIdx = currentLeapIdx(info);
    if (viewLeapIdx == null) viewLeapIdx = curIdx;
    const leap = LEAPS[viewLeapIdx];

    document.getElementById('leap-kicker').textContent = 'Leap ' + (viewLeapIdx + 1);
    document.getElementById('leap-name').textContent = leap.name;

    // Week range: from this leap's week to next leap's week (exclusive)
    const nextWeek = LEAPS[viewLeapIdx + 1] ? LEAPS[viewLeapIdx + 1].week : null;
    const weekText = nextWeek
      ? 'weeks ' + leap.week + '–' + (nextWeek - 1)
      : 'from week ' + leap.week;
    document.getElementById('leap-weeks').textContent = weekText;

    document.getElementById('leap-desc').textContent = leap.desc;

    // Milestones
    const ul = document.getElementById('milestones');
    ul.innerHTML = '';
    leap.milestones.forEach(function (ms) {
      const li = document.createElement('li');
      const done = !!milestones.checked[ms.id];
      if (done) li.classList.add('done');

      const check = document.createElement('span');
      check.className = 'check';
      check.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';

      const txt = document.createElement('span');
      txt.className = 'mtxt';
      txt.textContent = ms.text;

      li.append(check, txt);

      li.addEventListener('click', function (ev) {
        const wasDone = !!milestones.checked[ms.id];
        if (wasDone) {
          delete milestones.checked[ms.id];
          li.classList.remove('done');
        } else {
          milestones.checked[ms.id] = true;
          li.classList.add('done');
          burstConfetti(ev.clientX || window.innerWidth / 2,
                        ev.clientY || window.innerHeight / 2);
        }
        saveMilestones();
      });

      ul.appendChild(li);
    });

    // Nav buttons
    document.getElementById('leap-prev').disabled = viewLeapIdx === 0;
    document.getElementById('leap-next').disabled = viewLeapIdx === LEAPS.length - 1;

    // Jump-to-current button
    const jump = document.getElementById('leap-jump');
    if (viewLeapIdx !== curIdx) {
      jump.hidden = false;
      jump.textContent = 'Back to current (Leap ' + (curIdx + 1) + ')';
    } else {
      jump.hidden = true;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Confetti (tiny canvas, no deps)
  // ─────────────────────────────────────────────────────────
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  let confettiParticles = [];
  let confettiRaf = null;

  function sizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const CONFETTI_COLORS = ['#E87FA3', '#F4A8B8', '#A786D1', '#7FB8D4', '#F9C5D5', '#C8A8E0', '#FFD6E0'];

  function burstConfetti(x, y) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const count = 42;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      confettiParticles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        g: 0.22,
        w: 6 + Math.random() * 5,
        h: 8 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 0,
        maxLife: 70 + Math.floor(Math.random() * 20),
      });
    }
    if (!confettiRaf) tickConfetti();
  }

  function tickConfetti() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiParticles = confettiParticles.filter(function (p) {
      p.life++;
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      return p.life < p.maxLife && p.y < window.innerHeight + 40;
    });
    if (confettiParticles.length) {
      confettiRaf = requestAnimationFrame(tickConfetti);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confettiRaf = null;
    }
  }

  // ─────────────────────────────────────────────────────────
  // Settings modal — open / close
  // ─────────────────────────────────────────────────────────
  const modal = document.getElementById('settings-modal');
  let editorDraft = null; // array of events while editing

  function openSettings() {
    editorDraft = schedule.events.map(function (e) { return Object.assign({}, e); });
    document.getElementById('field-name').value = settings.babyName || '';
    document.getElementById('field-birth').value = settings.birthDate || '';
    renderEditor();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSettings() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    editorDraft = null;
  }

  function renderEditor() {
    const ul = document.getElementById('editor');
    ul.innerHTML = '';
    editorDraft.forEach(function (e, idx) {
      const li = document.createElement('li');
      li.setAttribute('data-eid', e.id);

      const timeInput = document.createElement('input');
      timeInput.type = 'time';
      timeInput.value = minsToHHMM(e.time);
      timeInput.addEventListener('change', function () {
        const v = hhmmToMins(timeInput.value);
        if (v != null) editorDraft[idx].time = v;
      });

      const main = document.createElement('div');
      main.className = 'row-main';

      const textWrap = document.createElement('div');
      textWrap.className = 'row-text';

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.value = e.label;
      labelInput.placeholder = 'Label';
      labelInput.addEventListener('input', function () {
        editorDraft[idx].label = labelInput.value;
      });

      const kindSelect = document.createElement('select');
      KIND_LIST.forEach(function (k) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = KINDS[k].label;
        if (k === e.kind) opt.selected = true;
        kindSelect.appendChild(opt);
      });
      kindSelect.addEventListener('change', function () {
        editorDraft[idx].kind = kindSelect.value;
      });

      textWrap.append(labelInput, kindSelect);
      main.append(textWrap);

      const trash = document.createElement('button');
      trash.type = 'button';
      trash.className = 'trash-btn';
      trash.setAttribute('aria-label', 'Delete event');
      trash.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';
      trash.addEventListener('click', function () {
        editorDraft.splice(idx, 1);
        renderEditor();
      });

      li.append(timeInput, main, trash);
      ul.appendChild(li);
    });
  }

  function minsToHHMM(m) {
    m = Math.max(0, Math.min(1439, Math.round(m)));
    const h = Math.floor(m / 60), mm = m % 60;
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }

  function hhmmToMins(s) {
    if (!s) return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!m) return null;
    const h = Number(m[1]), mi = Number(m[2]);
    if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
    return h * 60 + mi;
  }

  // ─────────────────────────────────────────────────────────
  // Toast
  // ─────────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  // ─────────────────────────────────────────────────────────
  // Import / export
  // ─────────────────────────────────────────────────────────
  function exportSchedule() {
    const blob = new Blob([JSON.stringify(schedule, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dstr = new Date().toISOString().slice(0, 10);
    const name = (settings.babyName || 'baby').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = name + '-schedule-' + dstr + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Schedule exported');
  }

  function importScheduleFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.events)) {
          toast('That file does not look right');
          return;
        }
        const cleaned = parsed.events.map(normalizeEvent).filter(Boolean).sort(byTime);
        if (!cleaned.length) {
          toast('No valid events found');
          return;
        }
        editorDraft = cleaned.map(function (e) { return Object.assign({}, e); });
        renderEditor();
        toast('Loaded — review and save');
      } catch (e) {
        toast('Could not read that file');
      }
    };
    reader.onerror = function () { toast('Could not read that file'); };
    reader.readAsText(file);
  }

  // ─────────────────────────────────────────────────────────
  // Wire up events
  // ─────────────────────────────────────────────────────────
  document.getElementById('settings-btn').addEventListener('click', openSettings);

  Array.prototype.forEach.call(
    modal.querySelectorAll('[data-close]'),
    function (el) { el.addEventListener('click', closeSettings); }
  );

  document.getElementById('add-row').addEventListener('click', function () {
    const latest = editorDraft.length ? editorDraft[editorDraft.length - 1].time : mm(12, 0);
    const nextTime = Math.min(1439, latest + 30);
    editorDraft.push({ id: newId(), time: nextTime, label: 'New event', kind: 'wake' });
    renderEditor();
    // Scroll to the new row
    requestAnimationFrame(function () {
      const rows = document.querySelectorAll('#editor li');
      const last = rows[rows.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = last.querySelector('input[type="text"]');
        if (input) input.focus();
      }
    });
  });

  document.getElementById('save-btn').addEventListener('click', function () {
    // Capture name + birth
    const name = document.getElementById('field-name').value.trim();
    const birth = document.getElementById('field-birth').value;
    if (name) settings.babyName = name;
    if (birth) settings.birthDate = birth;
    saveSettings();

    // Normalize + save schedule
    const cleaned = editorDraft.map(normalizeEvent).filter(Boolean).sort(byTime);
    if (!cleaned.length) {
      toast('Add at least one event');
      return;
    }
    schedule = { version: 1, events: cleaned };
    saveSchedule();
    closeSettings();
    render();
    toast('Saved');
  });

  document.getElementById('export-btn').addEventListener('click', exportSchedule);

  document.getElementById('import-input').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (file) importScheduleFile(file);
    e.target.value = ''; // allow re-importing same file
  });

  document.getElementById('reset-btn').addEventListener('click', function () {
    if (!confirm('Reset schedule to the default? This will not touch checked milestones.')) return;
    editorDraft = structuredCloneSafe(DEFAULT_SCHEDULE).events;
    renderEditor();
    toast('Default loaded — review and save');
  });

  document.getElementById('leap-prev').addEventListener('click', function () {
    if (viewLeapIdx > 0) { viewLeapIdx--; renderLeap(ageInfo(settings.birthDate)); }
  });
  document.getElementById('leap-next').addEventListener('click', function () {
    if (viewLeapIdx < LEAPS.length - 1) { viewLeapIdx++; renderLeap(ageInfo(settings.birthDate)); }
  });
  document.getElementById('leap-jump').addEventListener('click', function () {
    viewLeapIdx = currentLeapIdx(ageInfo(settings.birthDate));
    renderLeap(ageInfo(settings.birthDate));
  });

  // Close modal on backdrop touch
  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute('data-close')) closeSettings();
  });

  // Close modal with Escape
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeSettings();
  });

  // Re-render periodically
  render();
  setInterval(render, 30000);

  // Re-render on wake / return to tab
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) render();
  });

  // Re-render when color scheme changes
  try {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', render);
    else if (mq.addListener) mq.addListener(render);
  } catch (_) {}
})();
