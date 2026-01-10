/**
 * @typedef {Object} GameModule
 * @property {string} id - unique game id
 * @property {string} name - display name
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {(room: any) => Promise<boolean>} canStart
 * @property {(room: any, interaction: any) => Promise<void>} start
 */
