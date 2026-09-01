(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector('[data-site-header]');
  const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  const dropdown = document.querySelector('.nav-dropdown');
  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  const menuClose = document.querySelector('.menu-close');
  const overlay = document.querySelector('[data-menu-overlay]');
  const mobileHomeToggle = document.querySelector('.mobile-home-toggle');
  const mobileSubmenu = document.querySelector('.mobile-submenu');
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const directionToggles = document.querySelectorAll('.direction-toggle');
  let menuReturnFocus = null;
  let dropdownCloseTimer = null;

  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) { /* Storage can be unavailable. */ }
    }
  };

  const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const setTheme = (preference, persist = true) => {
    const theme = preference === 'system'
      ? (systemThemeQuery.matches ? 'dark' : 'light')
      : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    const dark = theme === 'dark';
    themeToggles.forEach((button) => {
      const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    document.querySelectorAll('[data-theme-label]').forEach((label) => {
      label.textContent = dark ? 'Light mode' : 'Dark mode';
    });
    document.querySelectorAll('[data-theme-preference]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themePreference === preference));
    });
    if (persist) storage.set('vertex-theme', preference);
  };

  const setDirection = (direction, persist = true) => {
    root.dir = direction;
    const rtl = direction === 'rtl';
    directionToggles.forEach((button) => {
      const label = rtl ? 'Switch to LTR' : 'Switch to RTL';
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    document.querySelectorAll('[data-direction-label]').forEach((label) => {
      label.textContent = rtl ? 'LTR' : 'RTL';
    });
    document.querySelectorAll('[data-direction-short]').forEach((label) => {
      label.textContent = rtl ? 'LTR' : 'RTL';
    });
    document.querySelectorAll('[data-direction-preference]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.directionPreference === direction));
    });
    if (persist) storage.set('vertex-direction', direction);
  };

  const savedTheme = storage.get('vertex-theme');
  const preferredTheme = ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
  setTheme(preferredTheme, false);
  setDirection(storage.get('vertex-direction') || 'ltr', false);

  themeToggles.forEach((button) => button.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  }));
  directionToggles.forEach((button) => button.addEventListener('click', () => {
    setDirection(root.dir === 'rtl' ? 'ltr' : 'rtl');
  }));
  document.querySelectorAll('[data-theme-preference]').forEach((button) => {
    button.addEventListener('click', () => setTheme(button.dataset.themePreference));
  });
  document.querySelectorAll('[data-direction-preference]').forEach((button) => {
    button.addEventListener('click', () => setDirection(button.dataset.directionPreference));
  });
  systemThemeQuery.addEventListener?.('change', () => {
    if ((storage.get('vertex-theme') || 'system') === 'system') setTheme('system', false);
  });

  const closeDropdown = (restoreFocus = false) => {
    if (!dropdown || !dropdownToggle) return;
    dropdown.classList.remove('is-open');
    dropdownToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) dropdownToggle.focus();
  };

  const openDropdown = () => {
    if (!dropdown || !dropdownToggle) return;
    window.clearTimeout(dropdownCloseTimer);
    dropdown.classList.add('is-open');
    dropdownToggle.setAttribute('aria-expanded', 'true');
  };

  dropdownToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = dropdown.classList.contains('is-open');
    if (isOpen) closeDropdown();
    else {
      openDropdown();
      dropdown.querySelector('a')?.focus();
    }
  });
  const dropdownItem = document.querySelector('.nav-item-dropdown');
  dropdownItem?.addEventListener('mouseenter', openDropdown);
  dropdownItem?.addEventListener('mouseleave', () => {
    dropdownCloseTimer = window.setTimeout(() => closeDropdown(), 160);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-item-dropdown')) closeDropdown();
  });
  dropdown?.addEventListener('keydown', (event) => {
    const items = [...dropdown.querySelectorAll('a')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); items[(index + 1) % items.length].focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); items[(index - 1 + items.length) % items.length].focus(); }
    if (event.key === 'Escape') { event.preventDefault(); closeDropdown(true); }
  });

  const focusableInMenu = () => [...menu.querySelectorAll('a, button:not([disabled])')];
  const openMenu = () => {
    menuReturnFocus = document.activeElement;
    menu.classList.add('is-open');
    overlay.classList.add('is-visible');
    menu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation menu');
    body.classList.add('menu-open');
    menuClose.focus();
  };
  const closeMenu = (restoreFocus = true) => {
    menu.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    body.classList.remove('menu-open');
    if (restoreFocus) menuReturnFocus?.focus();
  };

  menuToggle?.addEventListener('click', () => menu.classList.contains('is-open') ? closeMenu() : openMenu());
  menuClose?.addEventListener('click', () => closeMenu());
  overlay?.addEventListener('click', () => closeMenu());
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu(false)));
  mobileHomeToggle?.addEventListener('click', () => {
    const open = mobileSubmenu.classList.toggle('is-open');
    mobileHomeToggle.setAttribute('aria-expanded', String(open));
  });

  menu?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const items = focusableInMenu();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (menu?.classList.contains('is-open')) closeMenu();
    else if (dropdown?.classList.contains('is-open')) closeDropdown(true);
  });

  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 20);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100 && menu?.classList.contains('is-open')) closeMenu(false);
  });

  document.querySelectorAll('[data-current-year]').forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  const counters = [...document.querySelectorAll('[data-counter]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animateCounter = (counter) => {
    if (counter.dataset.counted === 'true') return;
    counter.dataset.counted = 'true';
    const target = Number(counter.dataset.counter);
    if (reduceMotion || !Number.isFinite(target)) {
      counter.textContent = String(target);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && !reduceMotion) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('[data-counter]').forEach(animateCounter);
        observer.unobserve(entry.target);
      });
    }, { threshold: .35 });
    const statsSection = document.querySelector('.trust-stats');
    if (statsSection) counterObserver.observe(statsSection);
  } else {
    counters.forEach(animateCounter);
  }

  document.querySelectorAll('[data-discipline-selector]').forEach((selector) => {
    const tabs = [...selector.querySelectorAll('[role="tab"]')];
    const panels = [...selector.querySelectorAll('[role="tabpanel"]')];

    const activateDiscipline = (tab, moveFocus = false) => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel) => {
        const active = panel.id === tab.getAttribute('aria-controls');
        panel.hidden = !active;
        panel.classList.remove('is-entering');
        if (active && !reduceMotion) {
          requestAnimationFrame(() => panel.classList.add('is-entering'));
        }
      });

      if (moveFocus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateDiscipline(tab));
      tab.addEventListener('keydown', (event) => {
        const rtl = document.documentElement.dir === 'rtl';
        let nextIndex = index;
        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else if (event.key === 'ArrowRight') nextIndex = (index + (rtl ? -1 : 1) + tabs.length) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index + (rtl ? 1 : -1) + tabs.length) % tabs.length;
        else if (event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else return;
        event.preventDefault();
        activateDiscipline(tabs[nextIndex], true);
      });
    });
  });

  document.querySelectorAll('[data-week-planner]').forEach((planner) => {
    const tabs = [...planner.querySelectorAll('[role="tab"]')];
    const panels = [...planner.querySelectorAll('[role="tabpanel"]')];

    const activateDay = (tab, moveFocus = false) => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.id !== tab.getAttribute('aria-controls');
      });
      if (moveFocus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateDay(tab));
      tab.addEventListener('keydown', (event) => {
        const rtl = document.documentElement.dir === 'rtl';
        let nextIndex = index;
        if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else if (event.key === 'ArrowRight') nextIndex = (index + (rtl ? -1 : 1) + tabs.length) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index + (rtl ? 1 : -1) + tabs.length) % tabs.length;
        else if (event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else return;
        event.preventDefault();
        activateDay(tabs[nextIndex], true);
      });
    });
  });

  document.querySelectorAll('[data-program-finder]').forEach((finder) => {
    const message = finder.querySelector('[data-finder-message]');
    const result = finder.querySelector('[data-program-result]');
    const resultTitle = finder.querySelector('[data-result-title]');
    const resultBest = finder.querySelector('[data-result-best]');
    const resultDescription = finder.querySelector('[data-result-description]');
    const resultLink = finder.querySelector('[data-result-link]');
    const groups = ['age', 'experience', 'goal'];
    const labels = {
      age: { 'under-8': 'Under 8', '8-12': 'Ages 8–12', '13-16': 'Ages 13–16', '17-plus': 'Ages 17+', adult: 'Adult Players' },
      experience: { beginner: 'Beginners', developing: 'Developing Players', intermediate: 'Intermediate Players', advanced: 'Advanced Players' }
    };
    const pathways = {
      foundations: { title: 'Cricket Foundations Program', description: 'Build confidence, coordination and essential cricket skills through engaging, age-appropriate coaching.', href: '#junior-coaching' },
      junior: { title: 'Junior Development Program', description: 'Build reliable fundamentals through structured batting, bowling, fielding and match-awareness coaching.', href: '#junior-coaching' },
      development: { title: 'Player Development Program', description: 'Strengthen technique and game understanding through progressive coaching, purposeful repetition and match scenarios.', href: '#advanced-training' },
      advanced: { title: 'Advanced Competitive Program', description: 'Prepare for higher-level cricket with demanding technical work, tactical development and competitive practice.', href: '#advanced-training' },
      specialist: { title: 'Specialist Skills Program', description: 'Develop a priority discipline through focused technical coaching, detailed feedback and repeatable practice plans.', href: '#advanced-training' },
      performance: { title: 'Performance & Conditioning Program', description: 'Build the physical capacity, movement quality and performance habits required for sustained competitive cricket.', href: '#fitness-conditioning' }
    };

    const choosePathway = ({ age, experience, goal }) => {
      if (goal === 'fitness') return pathways.performance;
      if (goal === 'specialist') return pathways.specialist;
      if (age === 'under-8') return pathways.foundations;
      if (age === '8-12' && ['beginner', 'developing'].includes(experience)) return pathways.junior;
      if (goal === 'competitive' || experience === 'advanced') return pathways.advanced;
      return pathways.development;
    };

    finder.addEventListener('change', (event) => {
      event.target.closest('fieldset')?.classList.remove('is-invalid');
      if (message) message.textContent = '';
    });

    finder.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(finder));
      const missing = groups.filter((group) => !data[group]);
      finder.querySelectorAll('fieldset').forEach((fieldset) => {
        fieldset.classList.toggle('is-invalid', missing.includes(fieldset.dataset.finderGroup));
      });
      if (missing.length) {
        if (message) message.textContent = 'Select one option in each category to continue.';
        finder.querySelector(`input[name="${missing[0]}"]`)?.focus();
        result.hidden = true;
        return;
      }

      const pathway = choosePathway(data);
      resultTitle.textContent = pathway.title;
      resultBest.textContent = `${labels.age[data.age]} • ${labels.experience[data.experience]}`;
      resultDescription.textContent = pathway.description;
      resultLink.href = pathway.href;
      result.hidden = false;
      result.classList.remove('is-entering');
      requestAnimationFrame(() => result.classList.add('is-entering'));
      if (message) message.textContent = 'Your recommended pathway is ready below.';
      result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    });
  });

  document.querySelectorAll('[data-specialist-console]').forEach((consoleElement) => {
    const tabs = [...consoleElement.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const activateSpecialist = (nextTab, moveFocus = false) => {
      tabs.forEach((tab, index) => {
        const selected = tab === nextTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].hidden = !selected;
        panels[index].classList.remove('is-entering');
        if (selected && !reduceMotion) requestAnimationFrame(() => panels[index].classList.add('is-entering'));
      });
      if (moveFocus) nextTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateSpecialist(tab));
      tab.addEventListener('keydown', (event) => {
        let nextIndex;
        if (event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        activateSpecialist(tabs[nextIndex], true);
      });
    });
  });

  document.querySelectorAll('[data-fees-accordion]').forEach((accordion) => {
    const buttons = [...accordion.querySelectorAll('button[aria-controls]')];
    buttons.forEach((button) => button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(!expanded));
      button.closest('.fees-faq-item')?.classList.toggle('is-open', !expanded);
      if (panel) panel.hidden = expanded;
    }));
  });

  document.querySelectorAll('[data-payment-selector]').forEach((selector) => {
    const tabs = [...selector.querySelectorAll('[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const activatePayment = (nextTab, moveFocus = false) => {
      tabs.forEach((tab, index) => {
        const selected = tab === nextTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].hidden = !selected;
      });
      if (moveFocus) nextTab.focus();
    };
    tabs.forEach((tab, index) => tab.addEventListener('keydown', (event) => {
      const rtl = document.documentElement.dir === 'rtl';
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + (rtl ? -1 : 1) + tabs.length) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index + (rtl ? 1 : -1) + tabs.length) % tabs.length;
      if (event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      activatePayment(tabs[nextIndex], true);
    }));
    tabs.forEach((tab) => tab.addEventListener('click', () => activatePayment(tab)));
  });

  document.querySelectorAll('[data-fee-comparison]').forEach((comparison) => {
    const select = comparison.querySelector('select');
    const panels = [...comparison.querySelectorAll('[data-plan-panel]')];
    const updatePlan = () => panels.forEach((panel) => {
      panel.hidden = panel.dataset.planPanel !== select.value;
    });
    select?.addEventListener('change', updatePlan);
    if (select) updatePlan();
  });

  document.querySelectorAll('[data-academy-map]').forEach((map) => {
    const tabs = [...map.querySelectorAll('.academy-map-marker[role="tab"]')];
    const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const activateZone = (nextTab, moveFocus = false) => {
      tabs.forEach((tab, index) => {
        const selected = tab === nextTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].hidden = !selected;
        panels[index].classList.remove('is-entering');
        if (selected && !reduceMotion) requestAnimationFrame(() => panels[index].classList.add('is-entering'));
      });
      if (moveFocus) nextTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateZone(tab));
      tab.addEventListener('mouseenter', () => activateZone(tab));
      tab.addEventListener('keydown', (event) => {
        const rtl = document.documentElement.dir === 'rtl';
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + (rtl ? -1 : 1) + tabs.length) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (index + (rtl ? 1 : -1) + tabs.length) % tabs.length;
        if (event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        activateZone(tabs[nextIndex], true);
      });
    });
  });

  document.querySelectorAll('[data-fixture-list]').forEach((fixtureList) => {
    const filters = [...fixtureList.querySelectorAll('[data-fixture-filter]')];
    const fixtures = [...fixtureList.querySelectorAll('[data-fixture-type]')];
    const result = fixtureList.querySelector('[data-fixture-result]');

    const applyFixtureFilter = (activeFilter) => {
      const type = activeFilter.dataset.fixtureFilter;
      let visibleCount = 0;

      filters.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === activeFilter)));
      fixtures.forEach((fixture) => {
        const visible = type === 'all' || fixture.dataset.fixtureType === type;
        fixture.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (result) {
        const label = type === 'all' ? 'upcoming events' : `${activeFilter.textContent.trim().toLowerCase()}`;
        result.textContent = `Showing ${visibleCount} ${label}.`;
      }
    };

    filters.forEach((filter) => filter.addEventListener('click', () => applyFixtureFilter(filter)));
  });

  document.querySelectorAll('[data-competition-calendar]').forEach((calendar) => {
    const events = [
      { date: '2026-09-12', name: 'Junior Academy League', type: 'match', label: 'Academy Match', age: 'U14', time: '9:00 AM', venue: 'Academy Ground', status: 'Registration Open' },
      { date: '2026-09-20', name: 'U16 Selection Trial', type: 'trial', label: 'Selection Trial', age: 'U16', time: '8:00 AM', venue: 'Main Nets', status: 'Selection Trial' },
      { date: '2026-09-30', name: 'Championship Entry Deadline', type: 'deadline', label: 'Registration Deadline', age: 'U16', time: '6:00 PM', venue: 'Online Registration', status: 'Entries Closing' },
      { date: '2026-10-05', name: 'Inter-Academy Challenge', type: 'tournament', label: 'Tournament', age: 'U18', time: '10:00 AM', venue: 'Regional Cricket Ground', status: 'Confirmed' },
      { date: '2026-10-11', name: 'Pre-Tournament Assessment', type: 'assessment', label: 'Assessment Event', age: 'U16', time: '4:30 PM', venue: 'Performance Centre', status: 'Invitations Open' },
      { date: '2026-10-18', name: 'Academy Championship', type: 'tournament', label: 'Tournament', age: 'U16', time: '9:30 AM', venue: 'Academy Main Ground', status: 'Registration Open' },
      { date: '2026-11-02', name: 'Junior Development Cup', type: 'tournament', label: 'Tournament', age: 'U12', time: '9:00 AM', venue: 'Academy Ground', status: 'Confirmed' },
      { date: '2026-11-14', name: 'U14 Academy Match', type: 'match', label: 'Academy Match', age: 'U14', time: '10:00 AM', venue: 'Academy Ground', status: 'Upcoming' }
    ];
    const months = [{ year: 2026, month: 8 }, { year: 2026, month: 9 }, { year: 2026, month: 10 }];
    const grid = calendar.querySelector('[data-calendar-grid]');
    const agenda = calendar.querySelector('[data-calendar-agenda]');
    const monthLabel = calendar.querySelector('[data-calendar-month]');
    const previous = calendar.querySelector('[data-calendar-previous]');
    const next = calendar.querySelector('[data-calendar-next]');
    let monthIndex = 0;
    let selectedDate = events[0].date;

    const formatMonth = ({ year, month }) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
    const eventForDate = (date) => events.find((event) => event.date === date);
    const monthEvents = ({ year, month }) => events.filter((event) => {
      const date = new Date(`${event.date}T12:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    });

    const selectEvent = (event, moveFocus = false) => {
      selectedDate = event.date;
      const date = new Date(`${event.date}T12:00:00`);
      const eventIndex = events.indexOf(event) + 1;
      calendar.querySelector('[data-calendar-index]').textContent = String(eventIndex).padStart(2, '0');
      calendar.querySelector('[data-calendar-day]').textContent = String(date.getDate()).padStart(2, '0');
      calendar.querySelector('[data-calendar-weekday]').textContent = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date);
      calendar.querySelector('[data-calendar-date]').textContent = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
      calendar.querySelector('[data-calendar-event-name]').textContent = event.name;
      calendar.querySelector('[data-calendar-age]').textContent = event.age;
      calendar.querySelector('[data-calendar-time]').textContent = event.time;
      calendar.querySelector('[data-calendar-venue]').textContent = event.venue;
      calendar.querySelector('[data-calendar-status]').lastChild.textContent = event.status;
      const type = calendar.querySelector('[data-calendar-event-type]');
      type.textContent = event.label;
      type.className = `calendar-event-type is-${event.type}`;
      calendar.querySelectorAll('[data-calendar-date-button]').forEach((button) => {
        const selected = button.dataset.calendarDateButton === event.date;
        button.setAttribute('aria-selected', String(selected));
        button.classList.toggle('is-selected', selected);
        if (moveFocus && selected) button.focus();
      });
      calendar.querySelectorAll('[data-agenda-date]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.agendaDate === event.date)));
    };

    const renderCalendar = () => {
      const current = months[monthIndex];
      const label = formatMonth(current);
      const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
      const mondayOffset = (new Date(current.year, current.month, 1).getDay() + 6) % 7;
      const today = new Date();
      grid.innerHTML = '';
      agenda.innerHTML = '';
      monthLabel.textContent = label;
      grid.setAttribute('aria-label', `${label} competition calendar`);
      agenda.setAttribute('aria-label', `Events in ${label}`);
      previous.disabled = monthIndex === 0;
      next.disabled = monthIndex === months.length - 1;

      for (let offset = 0; offset < mondayOffset; offset += 1) {
        const spacer = document.createElement('span');
        spacer.className = 'calendar-day is-empty';
        spacer.setAttribute('aria-hidden', 'true');
        grid.appendChild(spacer);
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const event = eventForDate(date);
        const cell = document.createElement('div');
        cell.className = `calendar-day${event ? ' has-event' : ''}`;
        cell.setAttribute('role', 'gridcell');
        if (event) {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.calendarDateButton = date;
          button.setAttribute('aria-label', `${day} ${label}, ${event.label}: ${event.name}`);
          button.setAttribute('aria-selected', String(date === selectedDate));
          button.innerHTML = `<strong>${day}</strong><span class="calendar-event-mark is-${event.type}"><i></i>${event.label}</span>`;
          button.classList.toggle('is-selected', date === selectedDate);
          button.addEventListener('click', () => selectEvent(event));
          cell.appendChild(button);
        } else {
          const number = document.createElement('span');
          number.textContent = day;
          if (today.getFullYear() === current.year && today.getMonth() === current.month && today.getDate() === day) number.className = 'is-today';
          cell.appendChild(number);
        }
        grid.appendChild(cell);
      }

      monthEvents(current).forEach((event) => {
        const date = new Date(`${event.date}T12:00:00`);
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.agendaDate = event.date;
        button.setAttribute('aria-pressed', String(event.date === selectedDate));
        button.innerHTML = `<time datetime="${event.date}"><strong>${String(date.getDate()).padStart(2, '0')}</strong><span>${new Intl.DateTimeFormat('en', { month: 'short' }).format(date)}</span></time><span class="calendar-agenda-copy"><small class="is-${event.type}">${event.label}</small><b>${event.name}</b><em>${event.age} · ${event.time} · ${event.venue}</em></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>`;
        button.addEventListener('click', () => selectEvent(event));
        agenda.appendChild(button);
      });

      const visibleEvents = monthEvents(current);
      if (!visibleEvents.some((event) => event.date === selectedDate) && visibleEvents[0]) selectEvent(visibleEvents[0]);
    };

    const changeMonth = (direction) => {
      monthIndex = Math.max(0, Math.min(months.length - 1, monthIndex + direction));
      renderCalendar();
    };
    previous.addEventListener('click', () => changeMonth(-1));
    next.addEventListener('click', () => changeMonth(1));
    calendar.addEventListener('keydown', (keyboardEvent) => {
      const active = document.activeElement;
      if (!active.matches('[data-calendar-date-button]')) return;
      const buttons = [...grid.querySelectorAll('[data-calendar-date-button]')];
      const index = buttons.indexOf(active);
      const rtl = document.documentElement.dir === 'rtl';
      let target = index;
      if (keyboardEvent.key === 'ArrowRight') target += rtl ? -1 : 1;
      else if (keyboardEvent.key === 'ArrowLeft') target += rtl ? 1 : -1;
      else if (keyboardEvent.key === 'ArrowDown') target += 1;
      else if (keyboardEvent.key === 'ArrowUp') target -= 1;
      else if (keyboardEvent.key === 'Home') target = 0;
      else if (keyboardEvent.key === 'End') target = buttons.length - 1;
      else if (keyboardEvent.key === 'PageUp') { changeMonth(-1); return; }
      else if (keyboardEvent.key === 'PageDown') { changeMonth(1); return; }
      else return;
      keyboardEvent.preventDefault();
      buttons[Math.max(0, Math.min(buttons.length - 1, target))]?.focus();
    });
    renderCalendar();
    selectEvent(events[0]);
  });

  const newsletterForm = document.querySelector('.newsletter-form');
  const newsletterInput = newsletterForm?.querySelector('input[type="email"]');
  const newsletterControl = newsletterForm?.querySelector('.newsletter-control');
  const newsletterMessage = newsletterForm?.querySelector('.newsletter-message');

  const setNewsletterState = (state, message) => {
    newsletterControl?.classList.toggle('is-invalid', state === 'error');
    newsletterControl?.classList.toggle('is-valid', state === 'success');
    newsletterInput?.setAttribute('aria-invalid', String(state === 'error'));
    if (newsletterMessage) {
      newsletterMessage.textContent = message;
      newsletterMessage.className = `newsletter-message${state ? ` is-${state}` : ''}`;
    }
  };

  newsletterInput?.addEventListener('input', () => setNewsletterState('', ''));
  newsletterForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = newsletterInput.value.trim();
    if (!email || !newsletterInput.validity.valid) {
      setNewsletterState('error', 'Enter a valid email address to subscribe.');
      newsletterInput.focus();
      return;
    }
    setNewsletterState('success', 'Thank you — you are on the academy updates list.');
    newsletterForm.reset();
  });

  const tournamentUpdatesForm = document.querySelector('.tournament-updates-form');
  const tournamentUpdatesEmail = tournamentUpdatesForm?.querySelector('input[type="email"]');
  const tournamentUpdatesMessage = tournamentUpdatesForm?.querySelector('.tournament-update-message');

  const setTournamentUpdatesState = (state, message) => {
    tournamentUpdatesForm?.classList.toggle('is-invalid', state === 'error');
    tournamentUpdatesForm?.classList.toggle('is-valid', state === 'success');
    tournamentUpdatesEmail?.setAttribute('aria-invalid', String(state === 'error'));
    if (tournamentUpdatesMessage) {
      tournamentUpdatesMessage.textContent = message;
      tournamentUpdatesMessage.className = `tournament-update-message${state ? ` is-${state}` : ''}`;
    }
  };

  tournamentUpdatesEmail?.addEventListener('input', () => setTournamentUpdatesState('', ''));
  tournamentUpdatesForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!tournamentUpdatesEmail.value.trim() || !tournamentUpdatesEmail.validity.valid) {
      setTournamentUpdatesState('error', 'Enter a valid email address to continue.');
      tournamentUpdatesEmail.focus();
      return;
    }
    setTournamentUpdatesState('success', 'Your alert preferences are ready. Demo only — no subscription was sent.');
  });

  document.querySelectorAll('.enquiry-routing').forEach((routingSection) => {
    const routes = [...routingSection.querySelectorAll('.enquiry-route')];
    const contextIndex = routingSection.querySelector('[data-enquiry-context-index]');
    const contextTitle = routingSection.querySelector('[data-enquiry-context-title]');
    const contextMessage = routingSection.querySelector('[data-enquiry-context-message]');

    routes.forEach((route, index) => {
      route.addEventListener('click', () => {
        routes.forEach((item) => {
          const selected = item === route;
          item.classList.toggle('is-active', selected);
          item.setAttribute('aria-pressed', String(selected));
        });
        if (contextIndex) contextIndex.textContent = `${String(index + 1).padStart(2, '0')} / ${String(routes.length).padStart(2, '0')}`;
        if (contextTitle) contextTitle.textContent = route.querySelector('.enquiry-route-name')?.textContent.trim() || '';
        if (contextMessage) contextMessage.textContent = route.dataset.enquiryMessage || '';
        const enquirySelect = document.querySelector('#contact-enquiry-type');
        if (enquirySelect && [...enquirySelect.options].some((option) => option.value === route.dataset.enquiryRoute)) {
          enquirySelect.value = route.dataset.enquiryRoute;
          enquirySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  });

  document.querySelectorAll('.contact-enquiry-form').forEach((form) => {
    const submitButton = form.querySelector('.contact-form-submit');
    const errorSummary = form.querySelector('.contact-form-error-summary');
    const errorSummaryMessage = form.querySelector('[data-contact-error-summary-message]');
    const successState = form.querySelector('.contact-form-success');
    const messageInput = form.querySelector('#contact-message');
    const characterCount = form.querySelector('[data-contact-character-count]');
    let submittedFingerprint = '';

    const fields = {
      fullName: form.querySelector('#contact-full-name'),
      email: form.querySelector('#contact-email'),
      phone: form.querySelector('#contact-phone'),
      enquiryType: form.querySelector('#contact-enquiry-type'),
      message: messageInput
    };

    const setFieldError = (field, message) => {
      if (!field) return;
      const fieldContainer = field.closest('.contact-field');
      const error = fieldContainer?.querySelector('.contact-field-error');
      field.setAttribute('aria-invalid', String(Boolean(message)));
      fieldContainer?.classList.toggle('is-invalid', Boolean(message));
      if (error) error.textContent = message;
    };

    const validateField = (name) => {
      const field = fields[name];
      if (!field) return true;
      const value = field.value.trim();
      let error = '';
      if (name === 'fullName' && !value) error = 'Enter your full name.';
      if (name === 'email') {
        if (!value) error = 'Enter your email address.';
        else if (!field.validity.valid) error = 'Enter a valid email address, such as name@example.com.';
      }
      if (name === 'phone' && value) {
        const digits = value.replace(/\D/g, '');
        if (!/^[+\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) error = 'Enter a valid phone number with 7 to 15 digits.';
      }
      if (name === 'phone' && form.querySelector('[name="contactMethod"]:checked')?.value === 'phone' && !value) error = 'Enter a phone number when phone contact is preferred.';
      if (name === 'enquiryType' && !value) error = 'Choose what you are enquiring about.';
      if (name === 'message' && !value) error = 'Tell us how the academy can help.';
      setFieldError(field, error);
      return !error;
    };

    Object.entries(fields).forEach(([name, field]) => {
      field?.addEventListener('blur', () => validateField(name));
      field?.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(name);
        errorSummary?.setAttribute('hidden', '');
        submitButton?.removeAttribute('disabled');
        successState?.setAttribute('hidden', '');
        submittedFingerprint = '';
      });
      field?.addEventListener('change', () => {
        if (field.getAttribute('aria-invalid') === 'true') validateField(name);
        errorSummary?.setAttribute('hidden', '');
        submitButton?.removeAttribute('disabled');
        successState?.setAttribute('hidden', '');
        submittedFingerprint = '';
      });
    });

    form.querySelectorAll('[name="contactMethod"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        validateField('phone');
        submitButton?.removeAttribute('disabled');
        successState?.setAttribute('hidden', '');
        submittedFingerprint = '';
      });
    });

    messageInput?.addEventListener('input', () => {
      if (characterCount) characterCount.textContent = String(messageInput.value.length);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const invalidFields = Object.keys(fields).filter((name) => !validateField(name));
      if (invalidFields.length) {
        successState?.setAttribute('hidden', '');
        errorSummary?.removeAttribute('hidden');
        if (errorSummaryMessage) errorSummaryMessage.textContent = `${invalidFields.length} ${invalidFields.length === 1 ? 'field needs' : 'fields need'} your attention.`;
        errorSummary?.focus();
        return;
      }

      errorSummary?.setAttribute('hidden', '');
      const fingerprint = new URLSearchParams(new FormData(form)).toString();
      if (fingerprint === submittedFingerprint) return;
      submittedFingerprint = fingerprint;
      submitButton?.setAttribute('disabled', '');
      successState?.removeAttribute('hidden');
      successState?.focus();
    });
  });

  document.querySelectorAll('[data-academy-hours]').forEach((board) => {
    const currentDay = new Date().getDay();
    board.querySelectorAll('[data-schedule-days]').forEach((row) => {
      const days = row.dataset.scheduleDays.split(',').map(Number);
      row.classList.toggle('is-current-day', days.includes(currentDay));
    });
  });

  document.querySelectorAll('.auth-form').forEach((form) => {
    const email = form.querySelector('#auth-email');
    const password = form.querySelector('#auth-password');
    const passwordToggle = form.querySelector('.auth-password-toggle');
    const alert = form.querySelector('.auth-form-alert');
    const demoMessage = form.querySelector('.auth-demo-message');
    const submitButton = form.querySelector('.auth-submit');

    const setError = (field, message) => {
      const container = field?.closest('.auth-field');
      const error = container?.querySelector('.auth-field-error');
      field?.setAttribute('aria-invalid', String(Boolean(message)));
      container?.classList.toggle('is-invalid', Boolean(message));
      if (error) error.textContent = message;
      return !message;
    };

    const validateEmail = () => {
      const value = email?.value.trim() || '';
      if (!value) return setError(email, 'Enter your email address.');
      if (!email.validity.valid) return setError(email, 'Enter a valid email address, such as you@example.com.');
      return setError(email, '');
    };

    const validatePassword = () => setError(password, password?.value ? '' : 'Enter your password.');

    passwordToggle?.addEventListener('click', () => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password';
      passwordToggle.setAttribute('aria-pressed', String(show));
      passwordToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      password.focus();
    });

    [[email, validateEmail], [password, validatePassword]].forEach(([field, validate]) => {
      field?.addEventListener('blur', validate);
      field?.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') validate();
        alert?.setAttribute('hidden', '');
        demoMessage?.setAttribute('hidden', '');
        submitButton?.removeAttribute('disabled');
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const emailValid = validateEmail();
      const passwordValid = validatePassword();
      if (!emailValid || !passwordValid) {
        demoMessage?.setAttribute('hidden', '');
        alert?.removeAttribute('hidden');
        alert?.focus();
        return;
      }
      alert?.setAttribute('hidden', '');
      submitButton?.setAttribute('disabled', '');
      demoMessage?.removeAttribute('hidden');
      demoMessage?.focus();
    });
  });

  document.querySelectorAll('.register-form').forEach((form) => {
    const accountTypes = [...form.querySelectorAll('[name="accountType"]')];
    const parentField = form.querySelector('.parent-player-field');
    const fields = {
      fullName: form.querySelector('#register-name'),
      playerName: form.querySelector('#register-player-name'),
      email: form.querySelector('#register-email'),
      phone: form.querySelector('#register-phone'),
      password: form.querySelector('#register-password'),
      confirm: form.querySelector('#register-confirm'),
      terms: form.querySelector('#register-terms')
    };
    const strength = form.querySelector('.register-strength');
    const strengthLabel = form.querySelector('[data-password-strength]');
    const alert = form.querySelector('.register-alert');
    const success = form.querySelector('.register-success');
    const submit = form.querySelector('.register-submit');

    const setError = (field, message) => {
      const container = field?.closest('.auth-field');
      const error = container?.querySelector('.auth-field-error');
      field?.setAttribute('aria-invalid', String(Boolean(message)));
      container?.classList.toggle('is-invalid', Boolean(message));
      if (error) error.textContent = message;
      return !message;
    };

    const isParent = () => form.querySelector('[name="accountType"]:checked')?.value === 'parent';
    const passwordScore = (value) => [value.length >= 8, /[A-Za-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value) || value.length >= 12].filter(Boolean).length;
    const updateStrength = () => {
      const value = fields.password.value;
      const score = value ? passwordScore(value) : 0;
      const levels = ['', 'weak', 'fair', 'good', 'strong'];
      const labels = ['Not set', 'Weak', 'Fair', 'Good', 'Strong'];
      strength.dataset.level = levels[score];
      strengthLabel.textContent = labels[score];
    };

    const validate = (name) => {
      const field = fields[name];
      const value = field?.value?.trim() || '';
      if (name === 'fullName') return setError(field, value ? '' : 'Enter your full name.');
      if (name === 'playerName') return setError(field, isParent() && !value ? 'Enter the player’s name.' : '');
      if (name === 'email') return setError(field, !value ? 'Enter your email address.' : field.validity.valid ? '' : 'Enter a valid email address.');
      if (name === 'phone') {
        const digits = value.replace(/\D/g, '');
        return setError(field, !value ? 'Enter your phone number.' : !/^[+\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15 ? 'Enter a valid phone number with 7 to 15 digits.' : '');
      }
      if (name === 'password') return setError(field, !value ? 'Create a password.' : value.length < 8 || !/[A-Za-z]/.test(value) || !/\d/.test(value) ? 'Use at least 8 characters with letters and numbers.' : '');
      if (name === 'confirm') return setError(field, !value ? 'Confirm your password.' : value !== fields.password.value ? 'Passwords do not match.' : '');
      if (name === 'terms') return setError(field, field.checked ? '' : 'Agree to the terms and privacy notice to continue.');
      return true;
    };

    accountTypes.forEach((radio) => radio.addEventListener('change', () => {
      const parent = isParent();
      parentField.hidden = !parent;
      fields.playerName.required = parent;
      if (!parent) { fields.playerName.value = ''; setError(fields.playerName, ''); }
    }));

    form.querySelectorAll('.auth-password-toggle').forEach((toggle) => toggle.addEventListener('click', () => {
      const input = toggle.closest('.auth-control').querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.setAttribute('aria-pressed', String(show));
      toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      input.focus();
    }));

    Object.entries(fields).forEach(([name, field]) => {
      field?.addEventListener('blur', () => validate(name));
      const clearState = () => {
        if (field.getAttribute('aria-invalid') === 'true') validate(name);
        if (name === 'password') { updateStrength(); if (fields.confirm.value) validate('confirm'); }
        alert?.setAttribute('hidden', '');
        success?.setAttribute('hidden', '');
        submit?.removeAttribute('disabled');
      };
      field?.addEventListener('input', clearState);
      field?.addEventListener('change', clearState);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const names = ['fullName', ...(isParent() ? ['playerName'] : []), 'email', 'phone', 'password', 'confirm', 'terms'];
      const invalid = names.filter((name) => !validate(name));
      if (invalid.length) {
        success?.setAttribute('hidden', '');
        alert?.removeAttribute('hidden');
        fields[invalid[0]]?.focus();
        return;
      }
      alert?.setAttribute('hidden', '');
      submit?.setAttribute('disabled', '');
      success?.removeAttribute('hidden');
      success?.focus();
    });
  });

  document.querySelectorAll('[data-error-back]').forEach((button) => {
    button.addEventListener('click', () => {
      if (window.history.length > 1) window.history.back();
      else window.location.href = 'Homepage1.html';
    });
  });

  document.querySelectorAll('[data-launch-countdown]').forEach((countdown) => {
    // Editable demo launch date. Replace this value when the academy confirms its launch.
    const launchDate = new Date('2026-12-01T09:00:00-05:00').getTime();
    const liveState = document.querySelector('[data-launch-live]');
    const values = {
      days: countdown.querySelector('[data-countdown-days]'),
      hours: countdown.querySelector('[data-countdown-hours]'),
      minutes: countdown.querySelector('[data-countdown-minutes]'),
      seconds: countdown.querySelector('[data-countdown-seconds]')
    };
    let timer;
    const renderCountdown = () => {
      const remaining = Math.max(0, launchDate - Date.now());
      if (remaining === 0) {
        countdown.hidden = true;
        liveState?.removeAttribute('hidden');
        if (timer) window.clearInterval(timer);
        return;
      }
      const totalSeconds = Math.floor(remaining / 1000);
      const parts = {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60
      };
      Object.entries(parts).forEach(([key, value]) => { if (values[key]) values[key].textContent = String(value).padStart(2, '0'); });
    };
    renderCountdown();
    timer = window.setInterval(renderCountdown, 1000);
  });

  document.querySelectorAll('.launch-notify').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const message = form.querySelector('.launch-notify-message');
    const setState = (state, text) => {
      form.classList.toggle('is-invalid', state === 'error');
      input.setAttribute('aria-invalid', String(state === 'error'));
      message.className = `launch-notify-message${state ? ` is-${state}` : ''}`;
      message.textContent = text;
    };
    input.addEventListener('input', () => setState('', ''));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!input.value.trim() || !input.validity.valid) {
        setState('error', 'Enter a valid email address to continue.');
        input.focus();
        return;
      }
      setState('success', 'Thanks — this demo form is ready to connect to your email service.');
    });
  });

  /* Shared page-section entrance motion. Hero areas stay immediately visible. */
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageSections = [...document.querySelectorAll('main section')].filter((section) => {
    const inHero = section.matches('[class*="hero"], [id*="hero"], [data-hero]') ||
      section.closest('[class*="hero"], [id*="hero"], [data-hero]');
    return !inHero && !section.closest('dialog') && !section.hasAttribute('hidden');
  });

  if (!motionReduced && 'IntersectionObserver' in window) {
    pageSections.forEach((section, index) => {
      section.classList.add('site-fade-up');
      section.style.setProperty('--fade-up-delay', `${(index % 4) * 55}ms`);
    });
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    pageSections.forEach((section) => sectionObserver.observe(section));
  } else {
    pageSections.forEach((section) => section.classList.add('is-visible'));
  }
})();
