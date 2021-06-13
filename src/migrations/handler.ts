import { IExtensionApi } from "vortex-api/lib/types/api";
import { ExtensionUpdateInfo } from "./types";
import * as semver from "semver";
import { util } from "vortex-api";
import { IGameModTable } from "../events";

/**
 * A simple wrapper function to use when registering migrations that simplifies the basic
 *  version checking and only runs when the current game is available with mods installed.
 * 
 * @param api The extension API.
 * @param gameId The game ID for this migration.
 * @param extInfo The extension update this migration is for.
 * @param callback The callback you want to run when this migration is required and run.
 */
export function migrationHandler(api: IExtensionApi, gameId: string|undefined, extInfo: ExtensionUpdateInfo, callback?: (api: IExtensionApi, extInfo: ExtensionUpdateInfo) => Promise<any>): (oldVersion: string) => Promise<any> {
    return (oldVersion) => {
        if (semver.neq(oldVersion, '0.0.0') && (semver.gte(oldVersion, extInfo.newVersion))) {
            return Promise.resolve();
        }
    
        const state = api.store.getState();
        if (gameId && gameId !== 'vortex') {
            const mods = util.getSafe<IGameModTable>(state, ['persistent', 'mods', gameId], {});
            const hasMods = Object.keys(mods).length > 0;
        
            if (!hasMods) {
                return Promise.resolve();
            }
        }

        extInfo.oldVersion = oldVersion;
    
        return callback 
            ? callback(api, extInfo)
            : Promise.resolve();
    }
    
}