import { log, selectors, util } from "vortex-api";
import { IDeployedFile, IExtensionApi, IModTable, IProfile } from "vortex-api/lib/types/api";
import { isActiveGame } from "..";
import { Deployment, DidDeployEventDelegate, EventDelegateOptions, GameModeActivatedEventDelegate, IGameModTable, ModsChangedEventDelegate, OnModsChangedOptions } from "./types";

export class EventHandler {
    private _api: IExtensionApi;
    private _gameId: string;
    /**
     *
     */
    constructor(api: IExtensionApi, gameId: string) {
        this._api = api;
        this._gameId = gameId;
        
    }

    private _isProfileGame = (profileId: string): boolean => {
        const state = this._api.getState();
        const profile: IProfile = selectors.profileById(state, profileId);
        return profile?.gameId === this._gameId;
    }

    private _didDeployListener = (handler: DidDeployEventDelegate, opts?: EventDelegateOptions): (profileId: string, deployment: { [typeId: string]: IDeployedFile[] }) => PromiseLike<void> => {
        opts ||= {name: 'deployment'};
            log('debug', `registering ${opts.name} event handler`);
            return async (profileId: string, deployment: Deployment) => {
                if (this._isProfileGame(profileId)) {
                    await handler(profileId, deployment);
                }
            } 
        
    }

    didDeploy = (handler: DidDeployEventDelegate, opts?: EventDelegateOptions) : EventHandler => {
        this._api.onAsync('did-deploy', this._didDeployListener(handler, opts));
        return this;
    }

    private _gameModeActivatedListener = (handler: GameModeActivatedEventDelegate, opts?: EventDelegateOptions) : (gameId: string) => void => {
        opts ||= {name: 'gamemode-activated'};
        log('debug', `registering ${opts.name} event handler`);
        return async (gameId: string) => {
            if (gameId === this._gameId) {
                handler(gameId);
            }
        } 
    }

    gameModeActivated = (handler: GameModeActivatedEventDelegate, opts?: EventDelegateOptions) : EventHandler => {
        this._api.events.on('gamemode-activated', this._gameModeActivatedListener(handler, opts));
        return this;
    }

    onGameModsChanged = (handler: ModsChangedEventDelegate, callback?: (err: Error) => void, opts?: OnModsChangedOptions): (oldValue: IGameModTable, newValue: IGameModTable) => void => {
        var name = opts?.name ?? 'mods changed event handler';
        var delayMs = opts?.delayMs || 4000;
        callback ||= (err) => log('warn', `Event handler for '${name}' completed!`, {err});
        if (!isActiveGame(this._api, this._gameId)) {
            return () => {};
        }
        let lastModTable: IGameModTable = this._api.store.getState().persistent.mods[this._gameId];
        log('debug', `scheduling ${name} on mods changed`)
    
        const updateDebouncer: util.Debouncer = new util.Debouncer(
            (newModTable: IGameModTable) => {
                if ((lastModTable === undefined) || (newModTable === undefined)) {
                    return Promise.resolve();
                }
                const state = this._api.store.getState();
                // ensure anything changed for the actiave game
                if ((lastModTable !== newModTable)
                    && (lastModTable !== undefined)
                    && (newModTable !== undefined)) {
                    var newIds = Object.keys(newModTable).filter(x => !Object.keys(lastModTable).includes(x));
                    if (!newIds || newIds.length == 0) {
                        return Promise.resolve();
                    }
                    var removedIds = Object.keys(lastModTable).filter(x => !Object.keys(newModTable).includes(x));
                    var newMods = newIds.map(i => newModTable[i]);
                    var removedMods = removedIds.map(i => lastModTable[i] ?? null).filter(nn => nn);
                    log('debug', `invoking ${name} delegate`, { newIds });
                    return handler(newModTable, {addedMods: newMods, removedMods});
                }
            }, delayMs);
    
        // we can't pass oldValue to the debouncer because that would only include the state
        // for the last time the debouncer is triggered, missing all other updates
        return (oldValue: IGameModTable, newValue: IGameModTable) =>
            updateDebouncer.schedule(callback, newValue);
    }
}