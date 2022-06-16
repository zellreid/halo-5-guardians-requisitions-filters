// ==UserScript==
// @name         Halo 5 Guardians Requisitions
// @namespace    https://github.com/zellreid/halo-5-guardians-requisitions-filters
// @version      2.5
// @description  A Tampermonkey userscript to add additional asset filters to the Halo 5 Guardians Requisitions
// @author       ZellReid
// @homepage     https://github.com/zellreid/halo-5-guardians-requisitions-filters
// @supportURL   https://github.com/zellreid/halo-5-guardians-requisitions-filters/issues
// @license      MIT
// @match        https://www.halowaypoint.com/en/halo-5-guardians/requisitions*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @run-at       document-body
// @grant        none
// ==/UserScript==

(function() {
    `use strict`;

    window.injectedFilters = {
        owned: {
            owned: true,
            notOwned: true,
            multi: false,
            addMulti: true
        },
        rarity: {
            common: true,
            uncommon: true,
            rare: true,
            ultraRare: true,
            legendary: true
        }
    };

    function getFilterContainer() {
        return document.getElementsByClassName(`service-record-header_header__132KP`)[0];
    }

    function doControlsExist(container, controlQuery) {
        return container.querySelector(controlQuery);
    }

    function addFilterControls() {
        var filterContainer = getFilterContainer();

        if (!doControlsExist(filterContainer, `#injectedFilterControls`)) {
            var controlsElement = document.createElement(`span`)
            controlsElement.id = `injectedFilterControls`;
            controlsElement.className = `filter-controls`;

            var ownedControlsElement = document.createElement(`fieldset`);
            ownedControlsElement.id = `ifcOwned`;
            ownedControlsElement.className = `filter-controls-owned`;

            //Owned
            var ownedCheckbox = createCheckbox(`Owned`, window.injectedFilters.owned.owned, toggleOwned, `ifcOwned`);
            ownedControlsElement.appendChild(ownedCheckbox);

            var notOwnedCheckbox = createCheckbox(`Not Owned`, window.injectedFilters.owned.notOwned, toggleNotOwned, null);
            ownedControlsElement.appendChild(notOwnedCheckbox);

            controlsElement.appendChild(ownedControlsElement);

            var rarityControlsElement = document.createElement(`fieldset`);
            rarityControlsElement.id = `ifcRarity`;
            rarityControlsElement.className = `filter-controls-rarity`;

            //Rarity
            var commonCheckbox = createCheckbox(`Common`, window.injectedFilters.rarity.common, toggleCommon, null);
            rarityControlsElement.appendChild(commonCheckbox);

            var uncommonCheckbox = createCheckbox(`Uncommon`, window.injectedFilters.rarity.uncommon, toggleUncommon, null);
            rarityControlsElement.appendChild(uncommonCheckbox);

            var rareCheckbox = createCheckbox(`Rare`, window.injectedFilters.rarity.rare, toggleRare, null);
            rarityControlsElement.appendChild(rareCheckbox);

            var ultraRareCheckbox = createCheckbox(`Ultra Rare`, window.injectedFilters.rarity.ultraRare, toggleUltraRare, null);
            rarityControlsElement.appendChild(ultraRareCheckbox);

            var legendaryCheckbox = createCheckbox(`Legendary`, window.injectedFilters.rarity.legendary, toggleLegendary, null);
            rarityControlsElement.appendChild(legendaryCheckbox);

            controlsElement.appendChild(rarityControlsElement);

            filterContainer.appendChild(controlsElement);
        }

        if ((window.injectedFilters.owned.addMulti) && (doControlsExist(document, `.reqCard`)) && (!doControlsExist(filterContainer, `#cbx_ifcMulti`))) {
            try {
                if (hasContainerCount(document.querySelector(`.reqCard`))) {
                    var multiCheckbox = createCheckbox(`> 1`, window.injectedFilters.owned.multi, toggleMulti, `ifcMulti`);
                    document.getElementById(`ifcOwned`).appendChild(multiCheckbox);
                }
            } catch {
                window.injectedFilters.owned.addMulti = false;
            }
        }
    }

    function createCheckbox(text, initial, onChange, id) {
        var labelElement = document.createElement(`label`);
        labelElement.style.marginLeft = `5px`;
        labelElement.style.marginRight = `5px`;
        labelElement.style.color = `white`;

        var checkboxElement = document.createElement(`input`);
        checkboxElement.type = `checkbox`;
        checkboxElement.checked = initial;
        checkboxElement.style.marginRight = `3px`;
        checkboxElement.addEventListener(`change`, onChange);

        if (id != null) {
            labelElement.id = `lbl_` + id;
            checkboxElement.id = `cbx_` + id;
        }

        labelElement.appendChild(checkboxElement);

        var textElement = document.createTextNode(text);
        labelElement.appendChild(textElement);

        return labelElement;
    }

    function toggleOwned(event) {
        window.injectedFilters.owned.owned = event.target.checked;

        if ((!window.injectedFilters.owned.owned)
        && (window.injectedFilters.owned.multi)) {
            window.injectedFilters.owned.multi = event.target.checked;
            document.getElementById(`cbx_ifcMulti`).checked = event.target.checked;
        }

        onBodyChange();
    }

    function toggleNotOwned(event) {
        window.injectedFilters.owned.notOwned = event.target.checked;
        onBodyChange();
    }

    function toggleMulti(event) {
        window.injectedFilters.owned.multi = event.target.checked;

        if ((window.injectedFilters.owned.multi)
        && (!window.injectedFilters.owned.owned)) {
            window.injectedFilters.owned.owned = event.target.checked;
            document.getElementById(`cbx_ifcOwned`).checked = event.target.checked;
        }

        onBodyChange();
    }

    function toggleCommon(event) {
        window.injectedFilters.rarity.common = event.target.checked;
        onBodyChange();
    }

    function toggleUncommon(event) {
        window.injectedFilters.rarity.uncommon = event.target.checked;
        onBodyChange();
    }

    function toggleRare(event) {
        window.injectedFilters.rarity.rare = event.target.checked;
        onBodyChange();
    }

    function toggleUltraRare(event) {
        window.injectedFilters.rarity.ultraRare = event.target.checked;
        onBodyChange();
    }

    function toggleLegendary(event) {
        window.injectedFilters.rarity.legendary = event.target.checked;
        onBodyChange();
    }

    function isContainerLocked(container) {
        return container.classList.contains(`locked`);
    }

    function hasContainerCount(container) {
        return container.querySelector(`.count`) != null ? true : false;
    }

    function getContainerCount(container) {
        if (hasContainerCount(container)) {
            return container.querySelector(`.count`).innerText.substring(1);
        } else {
            return 0;
        }
    }

    function getContainerRarity(container) {
        return container.querySelector(`.rarity`).innerText.toUpperCase();
    }

    function isContainerOwned(container) {
        var isOwned = true;

        if (isContainerLocked(container)) {
            isOwned = false;
        } else {
            if (hasContainerCount(container)) {
                if (getContainerCount(container) == 0) {
                    isOwned = false;
                }
            }
        }

        return isOwned;
    }

    function isContainerMulti(container) {
        var isMulti = false;

        if (hasContainerCount(container)) {
            if (getContainerCount(container) > 1) {
                isMulti = true;
            }
        }

        return isMulti;
    }

    function validateOwned(container, showContainer) {
        var isOwned = isContainerOwned(container);
        var isNotOwned = !isContainerOwned(container);

        if ((!window.injectedFilters.owned.owned && isOwned)
        || (!window.injectedFilters.owned.notOwned && isNotOwned)) {
            showContainer = false;
        }

        if (hasContainerCount(container)) {
            var isMulti = isContainerMulti(container);

            if (window.injectedFilters.owned.multi && !isMulti) {
                showContainer = false;
            }
        }

        return showContainer;
    }

    function validateRarity(container, showContainer) {
        switch(getContainerRarity(container)) {
            case `COMMON`:
                if (!window.injectedFilters.rarity.common) {
                    showContainer = false;
                }
                break;
            case `UNCOMMON`:
                if (!window.injectedFilters.rarity.uncommon) {
                    showContainer = false;
                }
                break;
            case `RARE`:
                if (!window.injectedFilters.rarity.rare) {
                    showContainer = false;
                }
                break;
            case `ULTRARARE`:
                if (!window.injectedFilters.rarity.ultraRare) {
                    showContainer = false;
                }
                break;
            case `LEGENDARY`:
                if (!window.injectedFilters.rarity.legendary) {
                    showContainer = false;
                }
                break;
        }

        return showContainer;
    }

    function toggleContainers(containerClassQuery) {
        var containers = document.getElementsByClassName(containerClassQuery);

        for (let container of containers) {
            var showContainer = true;
            showContainer = validateOwned(container, showContainer);
            showContainer = validateRarity(container, showContainer);

            if (!showContainer) {
                container.style.display = `none`;
            } else {
                container.style.display = null;
            }
        }
    }

    function onBodyChange(mut) {
        addFilterControls();
        toggleContainers(`reqCard`);
    }

    var mo = new MutationObserver(onBodyChange);
    mo.observe(document.body, {childList: true, subtree: true});
})();
