# Monday.com – Copy Item Link as Markdown (Firefox Extension)

## Overview

This is a lightweight Firefox WebExtension that adds a new option to Monday.com item menus: “Copy item link as Markdown”.

When you click it, the extension copies a Markdown-formatted link of the current item to your clipboard, like:

```
[Item title](https://YOUR.monday.com/boards/123/pulses/456)
```

Why? It’s convenient for pasting into docs, GitHub/GitLab issues, Slack (with Markdown rendering), Notion, or any editor that supports Markdown.

### Features

- Adds a sibling menu item next to Monday.com’s built‑in “Copy item link”.
- Copies a clean, normalized item URL (strips transient `/views/...` parts).
- Uses the item’s visible title for the Markdown link text.

### How it works

- The content script observes menus that appear in Monday.com’s UI.
- When it finds the standard “Copy item link” entry, it injects a new entry: “📋 Copy item link as Markdown”.
- Clicking it copies `[Item Title](Normalized URL)` to your clipboard and closes the menu.

### Installation (Temporary in Firefox for development)

1. Download or clone this repository.
2. Open Firefox and go to `about:debugging`.
3. Click “This Firefox”.
4. Click “Load Temporary Add-on…” and select the `manifest.json` file from this project folder.
5. Navigate to Monday.com and open any item. Open the item’s menu to see the new option.

### Usage

1. Open an item in Monday.com.
2. Open the item menu (the same menu that contains “Copy item link”).
3. Click “📋 Copy item link as Markdown”.
4. Paste the result wherever you need Markdown.

### Permissions

From `manifest.json`:

- `clipboardWrite` — required to write the Markdown string to the clipboard.
- Host permissions: `*://*.monday.com/*` — the extension only runs on Monday.com domains.

### Files of interest

- `manifest.json` — Firefox WebExtension manifest (Manifest V3).
- `content-script.js` — Injected into Monday.com pages; finds menus and adds the Markdown copy action.
- `icons/` — Extension icon assets.

### Technical notes

- URL normalization: The script converts URLs like `https://…/boards/123/views/456/pulses/789` to `https://…/boards/123/pulses/789` so links remain stable across views.
- Title detection: The script locates the nearest item title in the DOM. If it can’t find one, it falls back to a generic label.
- Menu detection: Uses a `MutationObserver` to watch for menus/popovers as they’re added to the DOM.

### Troubleshooting

- Don’t see the menu item?
    - Make sure the temporary add-on is loaded in `about:debugging` → This Firefox.
    - After making changes, click “Reload” next to the add-on in `about:debugging`, then refresh the Monday.com tab.
    - Monday.com’s DOM may change; if the built‑in menu structure changes, the selector heuristics might need updating in `content-script.js`.
- Clipboard blocked?
    - Firefox restricts clipboard writes to user-gesture contexts. Use the menu item directly after interacting with the page, and ensure the tab is focused.

### Development

- Edit `content-script.js` as needed; then go to `about:debugging` and click “Reload” on the temporary add-on, and refresh your Monday.com tab.
- Console logs appear in the page’s DevTools console.
- Optional: Use `web-ext` (Mozilla’s CLI) to run and lint: `npm install -g web-ext` then `web-ext run` or `web-ext lint` from the project folder.

### Privacy

- No data leaves your browser. The script only reads the page DOM to extract the item title and constructs a Markdown string for your clipboard.

### Acknowledgements

- Monday.com is a trademark of monday.com. This project is an independent, community-built utility and is not affiliated with or endorsed by monday.com.

Note on Chrome/Chromium

- The code is based on standard WebExtension APIs and may also work in Chromium-based browsers with minor changes. However, this repository targets Firefox by default.
