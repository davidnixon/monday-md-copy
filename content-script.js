/**
 * This content script adds a "Copy item link as Markdown" option to monday.com's item menus.
 * It works by observing the DOM for new menus and injecting a custom menu item.
 */

/**
 * Utility: copy text to clipboard
 * @param {string} text - The text to be copied
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log("Copied to clipboard:", text);
    } catch (err) {
        console.error("Failed to write clipboard:", err);
    }
}

/**
 * Normalizes a monday.com item URL by removing view information.
 * Example: https://xxx.monday.com/boards/123/views/456/pulses/789
 * Becomes: https://xxx.monday.com/boards/123/pulses/789
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL
 */
function normalizeMondayItemUrl(url = window.location.href) {
    // pattern captures the board part and the pulse part, ignoring the optional view part
    const pattern = /(.*\/boards\/\d+)(?:\/views\/\d+)?(\/pulses\/\d+)/;
    const match = url.match(pattern);

    if (!match) {
        return url; // fallback if the format changes or doesn't match the expected pattern
    }

    const [, boardPart, pulsePart] = match;
    return boardPart + pulsePart;
}

/**
 * Tries to find the item title and link from a menu element.
 * It looks for the closest title wrapper and extracts the text from the H2 element.
 * @param {HTMLElement} menuNode - The menu node to start searching from
 * @returns {{title: string, url: string}|null} Object containing title and url, or null if not found
 */
function getItemInfoFromMenuNode(menuNode) {
    // monday.com's item page usually has a .title-wrapper containing the item name
    const titleWrapperEl = menuNode.closest('.title-wrapper');
    if (!titleWrapperEl) {
        console.warn("Could not find related title for menu.");
        return null;
    }

    const titleEl = titleWrapperEl.querySelector("h2");
    if (!titleEl) {
        console.warn("Could not find related title for menu.");
        return null;
    }

    const title = titleEl ? titleEl.textContent.trim() : "Monday item";
    const cleanUrl = normalizeMondayItemUrl(window.location.href);


    return {title, url: cleanUrl};
}

/**
 * Creates a new menu item node by cloning an existing one and updating its behavior.
 * @param {HTMLElement} originalMenuItem - An existing menu item to use as a template
 * @returns {HTMLElement} The new Markdown copy menu item
 */
function createMarkdownMenuItem(originalMenuItem) {
    const newItem = originalMenuItem.cloneNode(true);

    // Update the label for the new menu item
    newItem.textContent = "📋 Copy item link as Markdown";

    // Remove any existing listeners by cloning, then add our own logic
    newItem.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();

        // Attempt to find the menu container to help locate the item title
        const menuNode = newItem.closest("ul, [role='menu'], .menu");
        const info = getItemInfoFromMenuNode(menuNode || document.body);
        if (!info) {
            console.warn("Could not get item info for markdown copy.");
            return;
        }

        const markdown = `[${info.title}](${info.url})`;
        // Copy to clipboard and then close the menu by clicking the trigger button
        copyToClipboard(markdown).then(document.querySelector('.pulse-page-menu-button').click());
    });

    return newItem;
}

/**
 * Attaches our custom "Copy as Markdown" menu item next to the standard "Copy item link".
 * @param {HTMLElement} menuNode - The menu container to enhance
 */
function enhanceMenu(menuNode) {
    if (!menuNode) return;

    // Search for the existing "Copy item link" or "Copy feature link" item
    const copyItemLink = Array.from(
        menuNode.querySelectorAll("li, button, [role='menuitem']")
    ).find((el) => {
        const text = el.textContent && el.textContent.trim().toLowerCase().replace(/\s+/g, " ");
        return text === "copy item link" || text === "copy feature link";
    });

    if (!copyItemLink) return;

    // Prevent adding the item multiple times to the same menu
    const alreadyAdded = Array.from(
        menuNode.querySelectorAll("li, button, [role='menuitem']")
    ).some((el) => {
        const text = el.textContent && el.textContent.trim().toLowerCase();
        return text === "copy item link as markdown";
    });

    if (alreadyAdded) return;

    const mdItem = createMarkdownMenuItem(copyItemLink);

    // Insert the new item right after the original "Copy item link"
    if (copyItemLink.parentNode) {
        copyItemLink.parentNode.insertBefore(mdItem, copyItemLink.nextSibling);
    }
}

/**
 * Sets up a MutationObserver to watch for new menus being added to the DOM.
 * This allows us to inject our button whenever a user opens a menu.
 */
function observeMenus() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof HTMLElement)) continue;

                // Check if the added node is a menu or contains one
                // Heuristics: menu popovers often use role="menu" or specific classes.
                if (
                    node.getAttribute?.("role") === "menu" ||
                    node.querySelector?.('[role="menu"]') ||
                    node.className.includes("menu") ||
                    node.className.includes("popover")
                ) {
                    enhanceMenu(node);
                }
            }
        }
    });

    // Start observing from the root element
    observer.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Performs an initial scan of the page for any menus that might already be open.
 */
function initialScan() {
    document.querySelectorAll('[role="menu"], .menu, .popover').forEach(enhanceMenu);
}

// Kick off the script
initialScan();
observeMenus();

