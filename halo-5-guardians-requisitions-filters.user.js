// ==UserScript==
// @name         Halo 5 Guardians Requisitions
// @namespace    https://github.com/zellreid/halo-5-guardians-requisitions-filters
// @version      6.0.26057.2
// @description  A Tampermonkey userscript to add additional asset filters to the Halo 5 Guardians Requisitions
// @author       ZellReid
// @homepage     https://github.com/zellreid/halo-5-guardians-requisitions-filters
// @supportURL   https://github.com/zellreid/halo-5-guardians-requisitions-filters/issues
// @license      MIT
// @match        https://www.halowaypoint.com/en/halo-5-guardians/requisitions*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-body
// @resource     CSSFilter https://raw.githubusercontent.com/zellreid/halo-5-guardians-requisitions-filters/main/halo-5-guardians-requisitions-filters.user.css
// @resource     IMGFilter https://raw.githubusercontent.com/zellreid/halo-5-guardians-requisitions-filters/dfe2d6891ccc3dadca173bf852e51b721b4f7f06/filter.png
// @grant        GM_getResourceURL
// @grant        GM_setValue
// @grant        GM_getValue
// @downloadURL  https://update.greasyfork.org/scripts/446563/Halo%205%20Guardians%20Requisitions.user.js
// @updateURL    https://update.greasyfork.org/scripts/446563/Halo%205%20Guardians%20Requisitions.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // ==================== RESILIENT SELECTOR RESOLVER ====================
    const SELECTOR_CACHE = new Map();

    function resolveClass(prefix) {
        if (SELECTOR_CACHE.has(prefix)) return SELECTOR_CACHE.get(prefix);
        const el = document.querySelector(`[class*="${prefix}"]`);
        if (el) {
            const match = Array.from(el.classList).find(c => c.startsWith(prefix));
            if (match) { SELECTOR_CACHE.set(prefix, match); return match; }
        }
        SELECTOR_CACHE.set(prefix, null);
        return null;
    }

    function clearSelectorCache() { SELECTOR_CACHE.clear(); }

    // ==================== SELECTOR PREFIXES ====================
    const PREFIXES = {
        reqPoints: 'halo-5-req-points_points__',
    };

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        selectors: {
            reqCard: 'reqCard',
            reqPoints: null,
            rarity: '.rarity',
            count: '.count',
            filterGroups: '.filter-groups'
        },
        ids: {
            filterButton: 'ifc_btn_Filter',
            filterContainer: 'injectedFilterControls',
            filterLabel: 'ifc_lbl_Filter',
            tagContainer: 'ifc_tag_container'
        },
        storage: {
            key: 'ifc_halo5_reqs'
        },
        ui: {
            reqPoints: {
                position: 'fixed',
                top: '100px',
                right: '100px',
                zIndex: '10000'
            }
        }
    };

    // ==================== STATE MANAGEMENT ====================
    const state = {
        info: GM_info,
        styles: [],
        elementCache: new Map(),
        ui: {
            floatReq: false,
            lblFilter: false,
            btnFilter: false,
            divFilter: false,
            divFilterShow: false,
            tagContainer: false,
            complete: false
        },
        filters: {
            totalCount: 0,
            filteredCount: 0,
            activeTags: [],
            owned: {
                selected: [],
                options: ['Owned', 'Not Owned']
            },
            multi: false,
            addMulti: true,
            rarity: {
                selected: [],
                options: ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Legendary']
            }
        }
    };
    window.injected = state;

    // ==================== UTILITY FUNCTIONS ====================
    function getElement(selector, useCache = true) {
        if (!selector) return null;
        if (useCache && state.elementCache.has(selector)) return state.elementCache.get(selector);
        const element = document.querySelector(selector);
        if (element && useCache) state.elementCache.set(selector, element);
        return element;
    }

    function clearElementCache() { state.elementCache.clear(); }

    function applyStyles(element, styles) {
        if (element && styles) Object.assign(element.style, styles);
    }

    function safeQuerySelector(container, selector, defaultValue = null) {
        try { return container.querySelector(selector) ?? defaultValue; }
        catch { return defaultValue; }
    }

    // ==================== RESOURCE MANAGEMENT ====================
    function addStyle(href) {
        return new Promise((resolve, reject) => {
            if (!href || isResourceAdded(state.styles, href)) {
                resolve({ success: true });
                return;
            }

            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = href;
            style.onload = () => { state.styles.push(style); resolve({ success: true }); };
            style.onerror = () => reject(new Error(`Style load error: ${href}`));
            document.head.appendChild(style);
        });
    }

    function isResourceAdded(resourceArray, url) {
        if (!resourceArray || !Array.isArray(resourceArray)) return false;
        return resourceArray.some(r => r.src === url || r.href === url);
    }

    // ==================== STATE PERSISTENCE ====================
    function saveFilterState() {
        try {
            const saveData = {
                owned: { selected: state.filters.owned.selected },
                multi: state.filters.multi,
                rarity: { selected: state.filters.rarity.selected }
            };
            GM_setValue(CONFIG.storage.key, JSON.stringify(saveData));
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to save filter state:', ex);
        }
    }

    function loadFilterState() {
        try {
            const saved = GM_getValue(CONFIG.storage.key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    if (parsed.owned && Array.isArray(parsed.owned.selected)) {
                        state.filters.owned.selected = parsed.owned.selected;
                    }
                    if (typeof parsed.multi === 'boolean') {
                        state.filters.multi = parsed.multi;
                    }
                    if (parsed.rarity && Array.isArray(parsed.rarity.selected)) {
                        state.filters.rarity.selected = parsed.rarity.selected;
                    }
                }
            }
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to load filter state:', ex);
        }
    }

    // ==================== TAG MANAGEMENT ====================
    function updateActiveTags() {
        const tags = [];
        state.filters.owned.selected.forEach(item =>
            tags.push({ type: 'owned', value: item, label: item })
        );
        if (state.filters.multi) {
            tags.push({ type: 'multi', value: 'multi', label: '> 1' });
        }
        state.filters.rarity.selected.forEach(item =>
            tags.push({ type: 'rarity', value: item, label: item })
        );
        state.filters.activeTags = tags;
        renderTags();
    }

    function renderTags() {
        const tagContainer = getElement(`#${CONFIG.ids.tagContainer}`);
        if (!tagContainer) return;
        tagContainer.innerHTML = '';

        if (state.filters.activeTags.length === 0) {
            tagContainer.style.display = 'none';
            return;
        }

        tagContainer.style.display = 'flex';
        state.filters.activeTags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'ifc-filter-tag';
            tagEl.textContent = tag.label;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'ifc-tag-remove';
            removeBtn.textContent = '\u00d7';
            removeBtn.setAttribute('aria-label', `Remove ${tag.label}`);
            removeBtn.onclick = () => removeTag(tag);

            tagEl.appendChild(removeBtn);
            tagContainer.appendChild(tagEl);
        });
    }

    function removeTag(tag) {
        switch (tag.type) {
            case 'owned':
                state.filters.owned.selected = state.filters.owned.selected.filter(v => v !== tag.value);
                updateCheckboxes('ifc_select_owned', state.filters.owned.selected);
                break;
            case 'multi':
                state.filters.multi = false;
                const multiCb = document.getElementById('cbx_ifcMulti');
                if (multiCb) multiCb.checked = false;
                break;
            case 'rarity':
                state.filters.rarity.selected = state.filters.rarity.selected.filter(v => v !== tag.value);
                updateCheckboxes('ifc_select_rarity', state.filters.rarity.selected);
                break;
        }
        updateScreen();
    }

    function updateCheckboxes(containerId, selectedValues) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = selectedValues.includes(cb.value);
        });
    }

    // ==================== CHECKBOX LIST CREATION ====================
    function createCheckboxList(id, options, selected = [], onChange) {
        const container = document.createElement('div');
        container.id = id;
        container.className = 'ifc-checkbox-list';

        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'ifc-checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option.value;
            checkbox.checked = selected.includes(option.value);
            checkbox.className = 'ifc-checkbox';
            checkbox.addEventListener('change', () => { if (onChange) onChange(); });

            const span = document.createElement('span');
            span.className = 'ifc-checkbox-label';
            span.textContent = option.label;

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        });

        return container;
    }

    function getCheckboxValues(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    }

    // ==================== UI INJECTIONS ====================
    function floatReqPoints() {
        if (state.ui.floatReq) return;

        try {
            // Resolve the hashed class name at runtime
            if (!CONFIG.selectors.reqPoints) {
                clearSelectorCache();
                const reqPointsClass = resolveClass(PREFIXES.reqPoints);
                if (!reqPointsClass) return;
                CONFIG.selectors.reqPoints = `.${CSS.escape(reqPointsClass)}`;
            }

            const container = getElement(CONFIG.selectors.reqPoints);
            if (!container) return;

            applyStyles(container, CONFIG.ui.reqPoints);
            state.ui.floatReq = true;
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to float req points:', ex);
        }
    }

    // ==================== UI CREATION HELPERS ====================
    function createFilterBlock(id = null, text = '', collapsible = true) {
        const groupContainer = document.createElement('li');
        if (id) groupContainer.id = `ifc_group_${id}`;
        groupContainer.className = 'ifc-accordion-group';

        if (!collapsible) {
            const cc = document.createElement('div');
            cc.className = 'ifc-filter-block-static';
            if (id) cc.id = `ifc_group_content_${id}`;
            const h = document.createElement('h3');
            h.className = 'ifc-filter-static-heading';
            h.textContent = text;
            cc.appendChild(h);
            groupContainer.appendChild(cc);
            return groupContainer;
        }

        const headerButton = document.createElement('button');
        headerButton.className = 'ifc-accordion-header';
        headerButton.setAttribute('aria-expanded', 'false');

        const headerText = document.createElement('span');
        headerText.className = 'ifc-accordion-title';
        headerText.textContent = text;

        const chevron = document.createElement('span');
        chevron.className = 'ifc-accordion-chevron';
        chevron.textContent = '\u25B6';

        headerButton.appendChild(headerText);
        headerButton.appendChild(chevron);

        const contentPanel = document.createElement('div');
        contentPanel.className = 'ifc-accordion-content';
        if (id) contentPanel.id = `ifc_group_content_${id}`;
        contentPanel.style.display = 'none';

        headerButton.addEventListener('click', () => {
            const isExpanded = headerButton.getAttribute('aria-expanded') === 'true';
            headerButton.setAttribute('aria-expanded', (!isExpanded).toString());
            contentPanel.style.display = isExpanded ? 'none' : 'block';
            chevron.textContent = isExpanded ? '\u25B6' : '\u25BC';
        });

        groupContainer.appendChild(headerButton);
        groupContainer.appendChild(contentPanel);
        return groupContainer;
    }

    function createImageLink(id, src, text) {
        const aContainer = document.createElement('a');
        if (id) aContainer.id = id;
        aContainer.title = text;
        aContainer.setAttribute('aria-label', text);
        aContainer.setAttribute('aria-pressed', 'false');

        const imgContainer = document.createElement('img');
        imgContainer.src = src;
        imgContainer.alt = text;
        imgContainer.title = text;

        aContainer.appendChild(imgContainer);
        return aContainer;
    }

    // ==================== FILTER CONTROLS ====================
    function addFilterControls() {
        try {
            addFilterLabel();
            addFilterButton();
            addFilterContainer();
            addFilterContainerOwned();
            addFilterContainerRarity();
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to add filter controls:', ex);
        }
    }

    function addFilterLabel() {
        if (state.ui.lblFilter) return;

        try {
            const label = document.createElement('label');
            label.id = CONFIG.ids.filterLabel;
            label.className = 'ifc-filter-label';
            label.textContent = `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`;
            document.body.appendChild(label);
            state.ui.lblFilter = true;
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to add filter label:', ex);
        }
    }

    function addFilterButton() {
        if (state.ui.btnFilter) return;

        try {
            const imgContainer = createImageLink(CONFIG.ids.filterButton, GM_getResourceURL('IMGFilter'), 'Filter');
            document.body.appendChild(imgContainer);
            state.ui.btnFilter = true;
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to add filter button:', ex);
        }
    }

    function addFilterContainer() {
        if (state.ui.divFilter) return;
        if (getElement(`#${CONFIG.ids.filterContainer}`, false)) return;

        try {
            const mainDiv = document.createElement('div');
            mainDiv.id = CONFIG.ids.filterContainer;
            mainDiv.className = 'filter-section';
            mainDiv.style.display = 'none';

            const heading = document.createElement('h2');
            heading.className = 'filter-text-heading';
            heading.textContent = 'Filters';

            const tagContainer = document.createElement('div');
            tagContainer.id = CONFIG.ids.tagContainer;
            tagContainer.className = 'ifc-tag-container';
            tagContainer.style.display = 'none';

            const filterGroups = document.createElement('ul');
            filterGroups.className = 'filter-groups';

            mainDiv.appendChild(heading);
            mainDiv.appendChild(tagContainer);
            mainDiv.appendChild(filterGroups);
            document.body.appendChild(mainDiv);

            state.ui.divFilter = true;
            state.ui.tagContainer = true;

            const imgContainer = getElement(`#${CONFIG.ids.filterButton}`);
            if (imgContainer) {
                imgContainer.addEventListener('click', toggleFilterContainer);
            }
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to add filter container:', ex);
        }
    }

    function addFilterContainerOwned() {
        if (!state.ui.divFilter) return;
        const groupName = 'Owned';

        try {
            if (getElement(`#ifc_group_${groupName}`, false)) return;
            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            if (!state.filters.owned.selected) state.filters.owned.selected = [];

            const filterBlock = createFilterBlock(groupName, 'Owned', true);
            const contentPanel = filterBlock.querySelector('.ifc-accordion-content');
            if (contentPanel) {
                const options = state.filters.owned.options.map(opt => ({ value: opt, label: opt }));
                contentPanel.appendChild(createCheckboxList('ifc_select_owned', options, state.filters.owned.selected, () => {
                    state.filters.owned.selected = getCheckboxValues('ifc_select_owned');
                    updateScreen();
                }));

                // Multi-quantity checkbox (added dynamically if applicable)
                addMultiCheckbox(contentPanel);
            }
            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to add owned filter:', ex);
        }
    }

    function addMultiCheckbox(container) {
        if (!state.filters.addMulti) return;
        if (document.getElementById('cbx_ifcMulti')) return;

        try {
            const firstCard = document.querySelector(`.${CONFIG.selectors.reqCard}`);
            if (!firstCard || !hasContainerCount(firstCard)) return;

            const label = document.createElement('label');
            label.className = 'ifc-checkbox-item';
            label.id = 'lbl_ifcMulti';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'cbx_ifcMulti';
            checkbox.checked = state.filters.multi;
            checkbox.className = 'ifc-checkbox';
            checkbox.addEventListener('change', (event) => {
                state.filters.multi = event.target.checked;
                updateScreen();
            });

            const span = document.createElement('span');
            span.className = 'ifc-checkbox-label';
            span.textContent = '> 1';

            label.appendChild(checkbox);
            label.appendChild(span);
            container.appendChild(label);
        } catch {
            state.filters.addMulti = false;
        }
    }

    function addFilterContainerRarity() {
        if (!state.ui.divFilter) return;
        const groupName = 'Rarity';

        try {
            if (getElement(`#ifc_group_${groupName}`, false)) return;
            const filterGroups = getElement(`#${CONFIG.ids.filterContainer} ${CONFIG.selectors.filterGroups}`);
            if (!filterGroups) return;

            if (!state.filters.rarity.selected) state.filters.rarity.selected = [];

            const filterBlock = createFilterBlock(groupName, 'Rarity', true);
            const contentPanel = filterBlock.querySelector('.ifc-accordion-content');
            if (contentPanel) {
                const options = state.filters.rarity.options.map(opt => ({ value: opt, label: opt }));
                contentPanel.appendChild(createCheckboxList('ifc_select_rarity', options, state.filters.rarity.selected, () => {
                    state.filters.rarity.selected = getCheckboxValues('ifc_select_rarity');
                    updateScreen();
                }));
            }
            filterGroups.appendChild(filterBlock);
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to add rarity filter:', ex);
        }
    }

    // ==================== TOGGLE HANDLERS ====================
    function toggleFilterContainer() {
        try {
            state.ui.divFilterShow = !state.ui.divFilterShow;
            const mainContainer = getElement(`#${CONFIG.ids.filterContainer}`);
            const filterButton = getElement(`#${CONFIG.ids.filterButton}`);
            if (!mainContainer) return;

            if (state.ui.divFilterShow) {
                mainContainer.style.display = null;
                if (filterButton) filterButton.setAttribute('aria-pressed', 'true');
            } else {
                mainContainer.style.display = 'none';
                if (filterButton) filterButton.setAttribute('aria-pressed', 'false');
            }
            onBodyChange();
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to toggle filter container:', ex);
        }
    }

    // ==================== CONTAINER HELPERS ====================
    function isContainerLocked(container) {
        return container.classList.contains('locked');
    }

    function hasContainerCount(container) {
        try {
            return container.querySelector(CONFIG.selectors.count) !== null;
        } catch {
            return false;
        }
    }

    function getContainerCount(container) {
        try {
            if (hasContainerCount(container)) {
                return parseInt(container.querySelector(CONFIG.selectors.count).innerText.substring(1), 10) || 0;
            }
        } catch {
            // Fall through to default
        }
        return 0;
    }

    function getContainerRarity(container) {
        try {
            const rarityEl = container.querySelector(CONFIG.selectors.rarity);
            return rarityEl ? rarityEl.innerText.toUpperCase() : '';
        } catch {
            return '';
        }
    }

    function isContainerOwned(container) {
        if (isContainerLocked(container)) return false;

        if (hasContainerCount(container)) {
            return getContainerCount(container) > 0;
        }

        return true;
    }

    function isContainerMulti(container) {
        return hasContainerCount(container) && getContainerCount(container) > 1;
    }

    // ==================== VALIDATION ====================
    function shouldShowContainer(container) {
        const isOwned = isContainerOwned(container);
        const rarity = getContainerRarity(container);

        // Owned filter (inverted logic: none selected = show all)
        if (state.filters.owned.selected.length > 0) {
            let match = false;
            if (state.filters.owned.selected.includes('Owned') && isOwned) match = true;
            if (state.filters.owned.selected.includes('Not Owned') && !isOwned) match = true;
            if (!match) return false;
        }

        // Multi filter
        if (state.filters.multi && hasContainerCount(container) && !isContainerMulti(container)) {
            return false;
        }

        // Rarity filter (inverted logic: none selected = show all)
        if (state.filters.rarity.selected.length > 0) {
            const rarityMap = {
                'COMMON': 'Common',
                'UNCOMMON': 'Uncommon',
                'RARE': 'Rare',
                'ULTRA RARE': 'Ultra Rare',
                'ULTRARARE': 'Ultra Rare',
                'LEGENDARY': 'Legendary'
            };
            const normalised = rarityMap[rarity] || null;
            if (normalised && !state.filters.rarity.selected.includes(normalised)) {
                return false;
            }
        }

        return true;
    }

    // ==================== ITEM FILTERING ====================
    function toggleContainers() {
        try {
            const containers = document.getElementsByClassName(CONFIG.selectors.reqCard);

            for (const container of containers) {
                const showContainer = shouldShowContainer(container);
                container.style.display = showContainer ? null : 'none';
            }
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to toggle containers:', ex);
        }
    }

    // ==================== FILTER COUNTS ====================
    function updateFilterCounts() {
        const containers = document.getElementsByClassName(CONFIG.selectors.reqCard);
        state.filters.totalCount = containers.length;
        state.filters.filteredCount = Array.from(containers).filter(c => c.style.display !== 'none').length;
    }

    function updateFilterLabels() {
        updateFilterCounts();
        const label = getElement(`#${CONFIG.ids.filterLabel}`);
        if (label) label.textContent = `Viewing ${state.filters.filteredCount} of ${state.filters.totalCount} results`;
    }

    function updateScreen() {
        try {
            toggleContainers();
            updateFilterLabels();
            updateActiveTags();
            saveFilterState();
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to update screen:', ex);
        }
    }

    // ==================== BODY CHANGE HANDLER ====================
    function onBodyChange() {
        try {
            floatReqPoints();

            if (document.querySelector(`.${CONFIG.selectors.reqCard}`)) {
                addFilterControls();
                toggleContainers();
                updateFilterLabels();
            }
        } catch (ex) {
            console.error('[Halo 5 Reqs] Error in body change handler:', ex);
        }
    }

    // ==================== INITIALIZATION ====================
    async function initialize() {
        try {
            await addStyle(GM_getResourceURL('CSSFilter'));
            loadFilterState();
            console.log(`[Halo 5 Reqs] v${state.info.script.version} loaded`);
        } catch (ex) {
            console.error('[Halo 5 Reqs] Failed to initialize resources:', ex);
        }
    }

    // ==================== START ====================
    const observer = new MutationObserver(onBodyChange);
    observer.observe(document.body, { childList: true, subtree: true });
    initialize();
})();
