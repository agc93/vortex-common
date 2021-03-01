import { IExtensionApi } from "vortex-api/lib/types/api";
import { ExtensionUpdateInfo } from "./types";
import * as semver from "semver";
import { util } from "vortex-api";
import { IGameModTable } from "../events";

export function migrationHandler(api: IExtensionApi, gameId: string, extInfo: ExtensionUpdateInfo, callback?: (api: IExtensionApi, extInfo: ExtensionUpdateInfo) => Promise<any>): (oldVersion: string) => Promise<any> {
    return (oldVersion) => {
        if (semver.neq(oldVersion, '0.0.0') && (semver.gte(oldVersion, extInfo.newVersion))) {
            return Promise.resolve();
        }
    
        const state = api.store.getState();
        const mods = util.getSafe<IGameModTable>(state, ['persistent', 'mods', gameId], {});
        const hasMods = Object.keys(mods).length > 0;
    
        if (!hasMods) {
            return Promise.resolve();
        }

        extInfo.oldVersion = oldVersion;
    
        return callback 
            ? callback(api, extInfo)
            : Promise.resolve();
    }
    
}