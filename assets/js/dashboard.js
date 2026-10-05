(() => {
    "use strict";

    const body = document.body;
    const sidebar = document.querySelector(".dashboard-sidebar");
    const menuToggle = document.querySelector(".dashboard-menu-toggle");
    const menuClose = document.querySelector(".dashboard-sidebar-close");
    const overlay = document.querySelector("[data-dashboard-overlay]");
    const notificationToggle = document.querySelector(".dashboard-notification-toggle");
    const notifications = document.querySelector(".dashboard-notifications");
    const profileToggle = document.querySelector(".dashboard-profile-toggle");
    const profileMenu = document.querySelector(".dashboard-profile-menu");
    const roleButtons = [...document.querySelectorAll("[data-dashboard-role]")];
    let drawerReturnFocus = null;

    const roleStorageKey = "vertexPortalDemoRole";
    const readRole = () => {
        try {
            return localStorage.getItem(roleStorageKey) === "parent" ? "parent" : "student";
        } catch {
            return "student";
        }
    };

    const applyRole = (role, persist = false) => {
        const isParent = role === "parent";
        const accountName = isParent ? "Priya Rao" : "Arjun Rao";
        document.documentElement.dataset.portalRole = role;
        document
            .querySelectorAll("[data-role-account-name], [data-role-menu-name]")
            .forEach((node) => {
                node.textContent = accountName;
            });
        document.querySelectorAll("[data-role-pill]").forEach((node) => {
            node.textContent = isParent ? "Parent · Viewing Arjun" : "Student";
        });
        document.querySelectorAll("[data-role-account-label]").forEach((node) => {
            node.textContent = isParent ? "Parent account" : "Player account";
        });
        document.querySelectorAll("[data-role-menu-detail]").forEach((node) => {
            node.textContent = isParent ? "Parent Access" : "Student View · U16";
        });
        document.querySelectorAll("[data-role-profile-link]").forEach((node) => {
            node.textContent = isParent ? "Player Profile" : "My Profile";
        });
        document.querySelectorAll("[data-parent-context]").forEach((node) => {
            node.hidden = !isParent;
        });
        document.querySelectorAll("[data-student-text][data-parent-text]").forEach((node) => {
            node.textContent = isParent ? node.dataset.parentText : node.dataset.studentText;
        });
        document.querySelectorAll(".dashboard-avatar img[data-student-src]").forEach((image) => {
            image.src = isParent ? image.dataset.parentSrc : image.dataset.studentSrc;
        });
        roleButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.dashboardRole === role));
        });
        profileToggle?.setAttribute("aria-label", `Open account menu for ${accountName}`);
        if (persist) {
            try {
                localStorage.setItem(roleStorageKey, role);
            } catch {
                /* Preview still works without storage. */
            }
        }
    };

    roleButtons.forEach((button) =>
        button.addEventListener("click", () => applyRole(button.dataset.dashboardRole, true)),
    );
    applyRole(readRole());

    const setPopover = (toggle, panel, open) => {
        if (!toggle || !panel) return;
        toggle.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
    };

    const closePopovers = () => {
        setPopover(notificationToggle, notifications, false);
        setPopover(profileToggle, profileMenu, false);
    };

    notificationToggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = notifications.hidden;
        closePopovers();
        setPopover(notificationToggle, notifications, open);
    });

    profileToggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = profileMenu.hidden;
        closePopovers();
        setPopover(profileToggle, profileMenu, open);
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".dashboard-popover")) closePopovers();
    });

    const drawerFocusable = () => [...sidebar.querySelectorAll("a, button:not([disabled])")];
    const openDrawer = () => {
        drawerReturnFocus = document.activeElement;
        sidebar.classList.add("is-open");
        overlay.classList.add("is-visible");
        sidebar.setAttribute("aria-hidden", "false");
        menuToggle.setAttribute("aria-expanded", "true");
        body.classList.add("menu-open");
        menuClose.focus();
    };

    const closeDrawer = (restoreFocus = true) => {
        sidebar.classList.remove("is-open");
        overlay.classList.remove("is-visible");
        menuToggle?.setAttribute("aria-expanded", "false");
        body.classList.remove("menu-open");
        if (window.innerWidth <= 1020) sidebar.setAttribute("aria-hidden", "true");
        if (restoreFocus) drawerReturnFocus?.focus();
    };

    menuToggle?.addEventListener("click", () =>
        sidebar.classList.contains("is-open") ? closeDrawer() : openDrawer(),
    );
    menuClose?.addEventListener("click", () => closeDrawer());
    overlay?.addEventListener("click", () => closeDrawer());
    sidebar?.querySelectorAll("a").forEach((link) =>
        link.addEventListener("click", () => {
            if (window.innerWidth <= 1020) closeDrawer(false);
        }),
    );

    sidebar?.addEventListener("keydown", (event) => {
        if (
            event.key !== "Tab" ||
            window.innerWidth > 1020 ||
            !sidebar.classList.contains("is-open")
        )
            return;
        const items = drawerFocusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (sidebar?.classList.contains("is-open")) closeDrawer();
        else closePopovers();
    });

    const syncResponsiveState = () => {
        if (!sidebar) return;
        if (window.innerWidth > 1020) {
            sidebar.classList.remove("is-open");
            overlay?.classList.remove("is-visible");
            sidebar.setAttribute("aria-hidden", "false");
            menuToggle?.setAttribute("aria-expanded", "false");
            body.classList.remove("menu-open");
        } else if (!sidebar.classList.contains("is-open")) {
            sidebar.setAttribute("aria-hidden", "true");
        }
    };

    syncResponsiveState();
    window.addEventListener("resize", syncResponsiveState);

    const sessionDialog = document.querySelector(".portal-session-dialog");
    const sessionButtons = [...document.querySelectorAll(".portal-session")];
    const sessionDialogClose = sessionDialog?.querySelector("[data-session-dialog-close]");
    let sessionReturnFocus = null;

    const setSessionText = (selector, value) => {
        const node = sessionDialog?.querySelector(selector);
        if (node) node.textContent = value;
    };

    sessionButtons.forEach((button) =>
        button.addEventListener("click", () => {
            if (!sessionDialog) return;
            sessionReturnFocus = button;
            setSessionText("[data-session-dialog-title]", button.dataset.sessionTitle);
            setSessionText("[data-session-dialog-time]", button.dataset.sessionTime);
            setSessionText("[data-session-dialog-coach]", button.dataset.sessionCoach);
            setSessionText("[data-session-dialog-venue]", button.dataset.sessionVenue);
            const focusList = sessionDialog.querySelector("[data-session-dialog-focus]");
            if (focusList) {
                focusList.replaceChildren(
                    ...button.dataset.sessionFocus.split("|").map((focus) => {
                        const item = document.createElement("li");
                        item.textContent = focus;
                        return item;
                    }),
                );
            }
            sessionDialog.showModal();
        }),
    );

    sessionDialogClose?.addEventListener("click", () => sessionDialog.close());
    sessionDialog?.addEventListener("click", (event) => {
        if (event.target === sessionDialog) sessionDialog.close();
    });
    sessionDialog?.addEventListener("close", () => sessionReturnFocus?.focus());

    const attendanceDays = [...document.querySelectorAll(".attendance-day")];
    const attendanceDetail = document.querySelector(".attendance-date-detail");
    const attendanceDetailFields = {
        date: document.querySelector("[data-attendance-date]"),
        session: document.querySelector("[data-attendance-session]"),
        status: document.querySelector("[data-attendance-status]"),
        time: document.querySelector("[data-attendance-time]"),
        coach: document.querySelector("[data-attendance-coach]"),
        venue: document.querySelector("[data-attendance-venue]"),
    };

    attendanceDays.forEach((day) => {
        if (!day.hasAttribute("aria-pressed")) day.setAttribute("aria-pressed", "false");
        day.addEventListener("click", () => {
            attendanceDays.forEach((item) => {
                item.classList.toggle("is-selected", item === day);
                item.setAttribute("aria-pressed", String(item === day));
            });
            Object.entries(attendanceDetailFields).forEach(([field, node]) => {
                if (node) node.textContent = day.dataset[field];
            });
            if (attendanceDetail)
                attendanceDetail.dataset.status = day.dataset.status
                    .toLowerCase()
                    .replace(" ", "-");
        });
    });

    const attendanceFilters = [...document.querySelectorAll("[data-attendance-filter]")];
    const attendanceRecords = [...document.querySelectorAll("[data-attendance-record]")];
    const attendanceEmpty = document.querySelector("[data-attendance-empty]");
    attendanceFilters.forEach((filterButton) =>
        filterButton.addEventListener("click", () => {
            const filter = filterButton.dataset.attendanceFilter;
            attendanceFilters.forEach((button) =>
                button.setAttribute("aria-pressed", String(button === filterButton)),
            );
            let visibleCount = 0;
            attendanceRecords.forEach((row) => {
                const visible = filter === "all" || row.dataset.attendanceRecord === filter;
                row.hidden = !visible;
                if (visible) visibleCount += 1;
            });
            if (attendanceEmpty) attendanceEmpty.hidden = visibleCount !== 0;
        }),
    );

    const feedbackFilters = [...document.querySelectorAll("[data-feedback-filter]")];
    const feedbackEntries = [...document.querySelectorAll("[data-feedback-entry]")];
    const feedbackEmpty = document.querySelector("[data-feedback-empty]");
    feedbackFilters.forEach((filterButton) =>
        filterButton.addEventListener("click", () => {
            const filter = filterButton.dataset.feedbackFilter;
            feedbackFilters.forEach((button) =>
                button.setAttribute("aria-pressed", String(button === filterButton)),
            );
            let visibleCount = 0;
            feedbackEntries.forEach((entry) => {
                const visible = filter === "all" || entry.dataset.feedbackEntry === filter;
                entry.hidden = !visible;
                if (visible) visibleCount += 1;
            });
            if (feedbackEmpty) feedbackEmpty.hidden = visibleCount !== 0;
        }),
    );
    const registerInterestButton = document.querySelector("[data-register-interest]");
    const registerInterestMessage = document.querySelector("[data-register-message]");
    if (registerInterestButton) registerInterestButton.setAttribute("aria-pressed", "false");
    registerInterestButton?.addEventListener("click", () => {
        if (registerInterestButton.getAttribute("aria-pressed") === "true") return;
        registerInterestButton.setAttribute("aria-pressed", "true");
        const label = registerInterestButton.firstChild;
        if (label) label.textContent = "Interest Noted ";
        if (registerInterestMessage)
            registerInterestMessage.textContent =
                "Demo preview only — no registration has been sent to the academy.";
    });

    const profileEditButton = document.querySelector("[data-profile-edit]");
    const profileForm = document.querySelector(".profile-edit-form");
    const profileActions = document.querySelector("[data-profile-actions]");
    const profileCancelButton = document.querySelector("[data-profile-cancel]");
    const profileStatus = document.querySelector("[data-profile-status]");
    const profileFields = [...(profileForm?.querySelectorAll("input") || [])];

    const setProfileEditing = (editing, reset = false) => {
        if (reset) profileForm?.reset();
        profileFields.forEach((field) => {
            field.disabled = !editing;
        });
        if (profileActions) profileActions.hidden = !editing;
        profileEditButton?.setAttribute("aria-expanded", String(editing));
        if (profileStatus && editing) profileStatus.textContent = "";
        if (editing) profileFields[0]?.focus();
        else profileEditButton?.focus();
    };

    profileEditButton?.addEventListener("click", () =>
        setProfileEditing(profileEditButton.getAttribute("aria-expanded") !== "true"),
    );
    profileCancelButton?.addEventListener("click", () => setProfileEditing(false, true));
    profileForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        setProfileEditing(false);
        if (profileStatus)
            profileStatus.textContent =
                "Demo changes applied to this page view only. Nothing was saved to a server.";
    });

    const settingsMessage = document.querySelector("[data-settings-account-message]");
    document.querySelector("[data-settings-contact]")?.addEventListener("click", () => {
        if (settingsMessage)
            settingsMessage.textContent =
                "Contact details can be edited from the Player Profile page in this demo.";
    });
    document.querySelector("[data-settings-password]")?.addEventListener("click", () => {
        if (settingsMessage)
            settingsMessage.textContent =
                "Password changes require a connected authentication service and are unavailable in this static demo.";
    });

    const notificationInputs = [...document.querySelectorAll("[data-notification-key]")];
    const notificationStatus = document.querySelector("[data-notification-status]");
    const notificationStorageKey = "vertexPortalNotifications";
    let savedNotifications = null;
    try {
        savedNotifications = JSON.parse(localStorage.getItem(notificationStorageKey));
    } catch (_) {
        savedNotifications = null;
    }
    if (savedNotifications && typeof savedNotifications === "object") {
        notificationInputs.forEach((input) => {
            if (typeof savedNotifications[input.dataset.notificationKey] === "boolean") {
                input.checked = savedNotifications[input.dataset.notificationKey];
            }
        });
    }
    notificationInputs.forEach((input) =>
        input.addEventListener("change", () => {
            const preferences = {};
            notificationInputs.forEach((item) => {
                preferences[item.dataset.notificationKey] = item.checked;
            });
            try {
                localStorage.setItem(notificationStorageKey, JSON.stringify(preferences));
            } catch (_) {
                /* Storage can be unavailable. */
            }
            if (notificationStatus)
                notificationStatus.textContent =
                    "Preferences saved locally for this template preview.";
        }),
    );
})();
