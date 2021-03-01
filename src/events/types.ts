import { IDeployedFile, IMod, IModTable } from "vortex-api/lib/types/api";

export interface IModChanges {
    addedMods: IMod[],
    removedMods: IMod[]
}

export type OnModsChangedOptions = {
    delayMs?: number;
    name?: string;
}

export type EventDelegateOptions = {
    name?: string;
}

export type ModsChangedEventDelegate = (currentMods: IGameModTable, changes: IModChanges) => PromiseLike<void>

export type DidDeployEventDelegate = (profileId: string, deployment: Deployment) => PromiseLike<any>;

export type GameModeActivatedEventDelegate = (gameId: string) => void;

export interface IGameModTable {[modId: string]: IMod;}

export type Deployment = { [typeId: string]: IDeployedFile[] };