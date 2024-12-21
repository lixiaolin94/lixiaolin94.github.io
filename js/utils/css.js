const getCSSVariable = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
