import { IDeployedFile, IMod, IModTable } from "vortex-api/lib/types/api";

/**
 * summary of the mods changed since the last event firing.
 */
export interface IModChanges {
    addedMods: IMod[],
    removedMods: IMod[]
}

/**
 * Options to fine-tune the state change listener.
 */
export type OnModsChangedOptions = {
    delayMs?: number;
    name?: string;
}

/**
 * Basic options to fine-tune/enrich the event handler.
 */
export type EventDelegateOptions = {
    name?: string;
}

/**
 * Delegate for when the installed mods for a given game change (such as after install/uninstall)
 */
export type ModsChangedEventDelegate = (currentMods: IGameModTable, changes: IModChanges) => PromiseLike<void>

/**
 * Delegate for the `did-deploy` event (after a deployment)
 */
export type DidDeployEventDelegate = (profileId: string, deployment: Deployment, setTitle?: (title: string) => void) => PromiseLike<any>;

/**
 * Delegate for the `gamemode-activated` event (when a game is activated)
 */
export type GameModeActivatedEventDelegate = (gameId: string) => void;

/**
 * Type alias for the per-game mod state (i.e. `state.persistent.mods.GAME_ID`)
 */
export interface IGameModTable {[modId: string]: IMod;}

/**
 * Type alias for the details of a deployment (used in deployment events).
 */
export type Deployment = { [typeId: string]: IDeployedFile[] };