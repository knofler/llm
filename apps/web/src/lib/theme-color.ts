/**
 * The status-bar colour per track: each track's page ground (globals.css
 * --color-a-page / --color-k-paper). Plain module so the server layout and the
 * client track provider can both import it.
 */
export const THEME_COLOR = { adults: "#0b0b0a", kids: "#fbf1df" } as const;
