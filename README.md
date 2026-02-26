# Halo 5 Guardians Requisitions Filters UserScript

[![License](https://img.shields.io/github/license/zellreid/halo-5-guardians-requisitions-filters)](https://github.com/zellreid/halo-5-guardians-requisitions-filters/blob/main/LICENSE.md)
[![Other](https://img.shields.io/badge/dynamic/json?style=social&label=Greasy%20Fork&query=total_installs&url=https%3A%2F%2Fgreasyfork.org%2F%2Fen%2Fscripts%2F446563-halo-5-guardians-requisitions.json&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3ggEBCQHM3fXsAAAAVdJREFUOMudkz2qwkAUhc/goBaGJBgUtBCZyj0ILkpwAW7Bws4yO3AHLiCtEFD8KVREkoiFxZzX5A2KGfN4F04zMN+ce+5c4LMUgDmANYBnrnV+plBSi+FwyHq9TgA2LQpvCiEiABwMBtzv95RSfoNEHy8DYBzHrNVqVEr9BWKcqNFoxF6vx3a7zc1mYyC73a4MogBg7vs+z+czO50OW60Wt9stK5UKp9Mpj8cjq9WqDTBHnjAdxzGQZrPJw+HA31oulzbAWgLoA0CWZVBKIY5jzGYzdLtdE9DlcrFNrY98zobqOA6TJKHW2jg4nU5sNBpFDp6mhVe5rsvVasUwDHm9Xqm15u12o+/7Hy0gD8KatOd5vN/v1FozTVN6nkchxFuI6hsAAIMg4OPxMJCXdtTbR7JJCMEgCJhlGUlyPB4XfumozInrupxMJpRSRtZlKoNYl+m/6/wDuWAjtPfsQuwAAAAASUVORK5CYII=)](https://greasyfork.org/en/scripts/446563-halo-5-guardians-requisitions)

A Tampermonkey/Greasemonkey userscript to add additional asset filters to the Halo 5 Guardians Requisitions page on Halo Waypoint.

## Features

**Filtering**
- Owned status filter - filter by Owned or Not Owned (inverted logic: none selected = show all)
- Multi-quantity filter - filter assets where quantity is greater than 1 (appears automatically when applicable)
- Rarity filter - filter by rarity tier: Common, Uncommon, Rare, Ultra Rare, Legendary (inverted logic)
- Active filter tags - visual tag bar showing all active filters with one-click removal

**UI Enhancements**
- Floating REQ points display - always visible while scrolling
- Filter count label - "Viewing X of Y results"
- Collapsible accordion panels for filter groups
- Custom checkbox styling matching the filter panel theme
- Glassmorphism styling - backdrop blur filter panel with dark theme
- Custom scrollbar styling
- State persistence - filter selections remembered between sessions

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome/Edge) or [Greasemonkey](https://www.greasespot.net/) (Firefox)
2. Install the userscript from [Greasy Fork](https://greasyfork.org/en/scripts/446563-halo-5-guardians-requisitions) or create a new script and paste the contents of `halo-5-guardians-requisitions-filters.user.js`
3. The CSS is loaded automatically via `@resource` - no manual CSS installation needed
4. Navigate to [Halo 5 Guardians Requisitions](https://www.halowaypoint.com/en/halo-5-guardians/requisitions) and the Filter button will appear

## Usage

Click the **Filter** button (top-right) to open the filter panel:
- **Owned**: Select ownership states to filter (none selected = show all)
- **> 1**: Show only assets with quantity greater than 1 (appears automatically when applicable)
- **Rarity**: Select rarity tiers to filter (none selected = show all)

Active filters appear as removable tags at the top of the panel.

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 6.0.26057.1 | Feb 2026 | Inverted filter logic, accordion UI, custom checkboxes, filter tags, state persistence, filter count label, removed jQuery/Bootstrap dependencies, code modernisation |
| 5.0.26057.1 | Feb 2026 | Code modernisation: const/let, CONFIG object, state management, error boundaries, factory patterns, defensive programming, updated CSS and docs |
| 4.4 | 2022 | Multi-quantity filter, rarity filters, floating REQ points |

## Technical Notes

- **Inverted Filter Logic**: No checkboxes selected means "show all" for that filter group. Selecting specific items restricts to only those selected.
- **State Persistence**: Filter selections are saved via `GM_setValue` and restored on page load.
- **Version Format**: `MAJOR.MINOR.YYDDD.REVISION` where `YYDDD` is the 2-digit year + day-of-year.
- **Dependencies**: None - pure vanilla JavaScript (jQuery and Bootstrap dependencies removed in v6.0).
- **Mutation Observer**: Watches for DOM changes to inject controls as the page loads dynamically.

## Issues

If you find a bug, please [report it](https://github.com/zellreid/halo-5-guardians-requisitions-filters/issues). Include:
- Script version
- Browser and userscript manager
- Steps to reproduce
- Console errors (if any)

## Contributing

This script is open source. Check the [Issues](https://github.com/zellreid/halo-5-guardians-requisitions-filters/issues) page for open items tagged "Accepted". Fork, branch, fix, and submit a pull request.

## License

Licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.
