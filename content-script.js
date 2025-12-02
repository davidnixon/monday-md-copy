// Utility: copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied to clipboard:", text);
  } catch (err) {
    console.error("Failed to write clipboard:", err);
  }
}
function normalizeMondayItemUrl(url = window.location.href) {
    // Example:
    // https://xxx.monday.com/boards/123/views/456/pulses/789
    const pattern = /(.*\/boards\/\d+)(?:\/views\/\d+)?(\/pulses\/\d+)/;
    const match = url.match(pattern);

    if (!match) {
        return url; // fallback if format changes
    }

    const [, boardPart, pulsePart] = match;
    return boardPart + pulsePart;
}


// Try to find item title and link from a menu element.
// You will likely want to adjust this depending on monday.com's DOM.
function getItemInfoFromMenuNode(menuNode) {
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


  return { title, url: cleanUrl };
}

// Create the new menu item node
function createMarkdownMenuItem(originalMenuItem) {
  const newItem = originalMenuItem.cloneNode(true);

  // Change text content
  newItem.textContent = "📋 Copy item link as Markdown";

  // Remove any existing listeners by cloning, then add our own
  newItem.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();

    const menuNode = newItem.closest("ul, [role='menu'], .menu");
    const info = getItemInfoFromMenuNode(menuNode || document.body);
    if (!info) {
      console.warn("Could not get item info for markdown copy.");
      return;
    }

    const markdown = `[${info.title}](${info.url})`;
    copyToClipboard(markdown).then(document.querySelector('.pulse-page-menu-button').click());
  });

  return newItem;
}

// Attach our menu item next to "Copy item link" if not already present
function enhanceMenu(menuNode) {
  if (!menuNode) return;

  // Adjust the selector so it finds the existing "Copy item link"
  const copyItemLink = Array.from(
    menuNode.querySelectorAll("li, button, [role='menuitem']")
  ).find((el) => {
    const text = el.textContent && el.textContent.trim().toLowerCase();
    return text === "copy item link";
  });

  if (!copyItemLink) return;

  // Prevent duplicates
  const alreadyAdded = Array.from(
    menuNode.querySelectorAll("li, button, [role='menuitem']")
  ).some((el) => {
    const text = el.textContent && el.textContent.trim().toLowerCase();
    return text === "copy item link as markdown";
  });

  if (alreadyAdded) return;

  const mdItem = createMarkdownMenuItem(copyItemLink);

  // Insert right after "Copy item link"
  if (copyItemLink.parentNode) {
    copyItemLink.parentNode.insertBefore(mdItem, copyItemLink.nextSibling);
  }
}

// Observe DOM changes to catch menus as they appear
function observeMenus() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

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

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });
}

// Initial scan for already-open menus
function initialScan() {
  document.querySelectorAll('[role="menu"], .menu, .popover').forEach(enhanceMenu);
}

initialScan();
observeMenus();

