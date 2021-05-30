import { fs, selectors, types, util } from "vortex-api";
import { LoadOrder } from "vortex-api/lib/extensions/file_based_loadorder/types/types";
import { ILoadOrderEntry } from ".";
import { getDiscoveryPath, isGameProfile } from "../util";
import path from 'path';
import { IExtensionApi, IState } from "vortex-api/lib/types/api";



export async function ensureLOFile(api: types.IExtensionApi, gameId: string, profileId?: string, fileName: string = 'loadOrder.json'): Promise<string> {
    var profile = getProfile(api, profileId);
    var targetPath = getDiscoveryPath(gameId, api.getState(), profile.id + '_' + fileName);
    try {
        await fs.statAsync(targetPath)
            .catch({ code: 'ENOENT' }, () => fs.writeFileAsync(targetPath, JSON.stringify({}), { encoding: 'utf8' }));
        return targetPath;
    } catch (err) {
        return Promise.reject(err);
    }
}

export function getProfile(api: IExtensionApi | IState, profileId?: string) {
    var state = (api as IExtensionApi).getState ? (api as IExtensionApi).getState() : api as IState;
    var profile = profileId ? selectors.profileById(state, profileId) : selectors.activeProfile(state);
    return profile;
}

export function makePrefix(input: number) {
    let res = '';
    let rest = input;
    while (rest > 0) {
        res = String.fromCharCode(65 + (rest % 25)) + res;
        rest = Math.floor(rest / 25);
    }
    return util.pad((res as any), 'A', 3);
}

/**
 * Creates a path prefix to represent the given mod's current load order position.
 * 
 * @param api The extension API.
 * @param mod The mod to create a prefix for.
 * @param profileId (optional) profile ID.
 * @returns A string with an order-derived alphabetical prefix.
 */
export function toLOPrefix(api: types.IExtensionApi, mod: types.IMod, profileId?: string): string {
    // As mentioned previously in this guide, we chose to use an alphabetical prefix
    //  but we could simply append a numeric prefix instead. The point of this fucntion
    //  is to insert the prefix in front of the mod's folder name.
    var state = api.getState();
    var profile = getProfile(state, profileId);

    if (state === undefined || profile === undefined) {
        return 'ZZZZ-' + mod.id;
    }

    // Retrieve the load order as stored in Vortex's application state.
    const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], []);

    // Find the mod entry in the load order state and insert the prefix in front
    //  of the mod's name/id/whatever
    const loEntry: ILoadOrderEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    return (loEntry?.data?.prefix !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}