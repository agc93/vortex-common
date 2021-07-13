import { fs, types, util } from "vortex-api";
import { LoadOrder } from "vortex-api/lib/extensions/file_based_loadorder/types/types";
import { ILoadOrderEntry, ISerializableData, LoadOrderFilter } from "./types";
import { ensureLOFile, getProfile, makePrefix } from "./util";

/**
 * Deserializes a load order from a load order file on disk.
 * 
 * @param api The extension API.
 * @param gameId The game ID to load for.
 * @param profileId The optional profile ID. (not currently used)
 * @param filterFn A simple predicate to filter mods from deserialization.
 * @returns A Promise for the deserialized load order.
 */
export async function deserialize(api: types.IExtensionApi, gameId: string, profileId?: string, filterFn?: LoadOrderFilter): Promise<LoadOrder> {
    /* var gameId = isGameProfile
    if (props?.profile?.gameId !== GAME_ID) {
      // Why are we deserializing when the profile is invalid or belongs to
      //  another game ?
      return [];
    } */
    filterFn ??= () => true;
    var state = api.getState();

    var profile = getProfile(api, profileId);
    // The deserialization function should be used to filter and insert wanted data into Vortex's
    //  loadOrder application state, once that's done, Vortex will trigger a serialization event
    //  which will ensure that the data is written to the LO file.
    const currentModsState = util.getSafe(profile, ['modState'], {});

    // we only want to insert enabled mods.
    const enabledModIds = Object.keys(currentModsState)
        .filter(modId => util.getSafe(currentModsState, [modId, 'enabled'], false));
    const mods: { [modId: string]: types.IMod } = util.getSafe(state, ['persistent', 'mods', gameId], {});
    const loFilePath = await ensureLOFile(api, gameId, profileId);
    const fileData = await fs.readFileAsync(loFilePath, { encoding: 'utf8' });
    try {
        if (fileData !== undefined && fileData.length > 0) {
            const data: ILoadOrderEntry[] = JSON.parse(fileData);

            // User may have disabled/removed a mod - we need to filter out any existing
            //  entries from the data we parsed.
            const filteredData = data
                .filter(entry => enabledModIds.includes(entry.id))
                .filter(entry => {
                    return filterFn(entry, entry.modId ? mods[entry.modId] : undefined);
                });

            // Check if the user added any new mods.
            const diff = enabledModIds.filter(id => filteredData.find(loEntry => loEntry.id === id) === undefined);

            // Add any newly added mods to the bottom of the loadOrder.
            diff.forEach(missingEntry => {
                filteredData.push({
                    id: missingEntry,
                    modId: missingEntry,
                    enabled: true,
                    name: mods[missingEntry] !== undefined
                        ? util.renderModName(mods[missingEntry])
                        : missingEntry,
                })
            });

            // At this point you may have noticed that we're not setting the prefix
            //  for the newly added mod entries - we could certainly do that here,
            //  but that would simply be code duplication as we need to assign prefixes
            //  during serialization anyway (otherwise user drag-drop interactions will
            //  not be saved)
            return filteredData.filter(entry => {
                return filterFn(entry, entry.modId ? mods[entry.modId] : undefined);
            });
        } else {
            api.sendNotification({
                type: 'warning',
                message: 'Failed to read load order data!'
            });
            return []
        }
    } catch (err) {
        return Promise.reject(err);
    }
}

/**
 * Serializes the given load order to disk.
 * 
 * @param api The extension API.
 * @param gameId The game ID to manage.
 * @param loadOrder The load order to serialize.
 * @param profileId The optional profile ID.
 * @returns A promise that resolves when the LO has been serialized.
 */
export async function serialize(api: types.IExtensionApi, gameId: string,
    loadOrder: LoadOrder, profileId?: string): Promise<void> {



    // Make sure the LO file is created and ready to be written to. Yes
    //  I know I’m deleting the file before writing to it again, but I was
    //  too lazy to search for the LO file location - this way I don’t have
    //  to know where it is; the ensure LO file function returns the
    //  the correct location
    const loFilePath = await ensureLOFile(api, gameId, profileId);

    // The array at this point is sorted in the order in which we want the game to load the
    //  mods, which means we can just loop through it and use the index to assign the prefix.
    const prefixedLO = loadOrder.map((loEntry: ILoadOrderEntry, idx: number) => {
        const prefix = makePrefix(idx);
        const data: ISerializableData = {
            prefix,
        };
        return { ...loEntry, data };
    });

    // Delete the existing file (if any) and write the prefixed LO to file.
    await fs.removeAsync(loFilePath).catch({ code: 'ENOENT' }, () => Promise.resolve());
    await fs.writeFileAsync(loFilePath, JSON.stringify(prefixedLO), { encoding: 'utf8' });
    return Promise.resolve();
}

/**
 * Validation function for validating the load order.
 * 
 * @remarks No actual validation is performed in this implementation!
 * @param prev The previous load order.
 * @param current The current load order.
 * @returns `undefined`: no validation is performed.
 */
export async function validate(prev: LoadOrder,
    current: LoadOrder): Promise<any> {
    // Nothing to validate really - the game does not read our load order file
    //  and we don't want to apply any restrictions either, so we just
    //  return.
    return undefined;
}