import { IProfile, ThunkStore, IState, IExtensionApi } from "vortex-api/lib/types/api";
import { selectors, log, actions } from "vortex-api";

/**
 * A simple wrapper class to assist with setting and retrieving profile features.
 * 
 * You will still need to register profile features using the usual `context.registerProfileFeature` syntax, but you can then easily set/get that feature with a `ProfileClient` instance.
 * 
 * @remarks If you are not familiar with how Vortex handles profile features, be *very careful*. This can be a minefield.
 * 
 * @example
 *```typescript
 *var client = new ProfileClient(context.api.store);
 *var feature = client.getProfileSetting('some_profile_feature', 'default value');
 *client.setProfileSetting('some_profile_feature', 'new value');
 *```
```
 */
export class ProfileClient {
    private state: IState;
    private store: ThunkStore<any>;
    /**
     * Creates a new instance of the profile client.
     * 
     * @remarks
     * - Using the store param directly is *strongly* recommended over providing the IExtensionApi object!
     * 
     * @param store The state store object (usually from IExtensionApi.store)
     */
    constructor(store: ThunkStore<any>);
    constructor(context: IExtensionApi);
    constructor(ctx: IExtensionApi | ThunkStore<any>) {
        this.store = (ctx as IExtensionApi) 
            ? (ctx as IExtensionApi).store
            : ctx as ThunkStore<any>;
        this.state = this.store.getState();
        this.getProfileSetting = this.getProfileSetting.bind(this);
    }

    /**
     * Sets the value of a given profile feature/setting on a given profile.
     * 
     * @param profile The profile to set the value on.
     * @param key The unique key for the profile feature/setting.
     * @param value The value to set/update for the profile feature/setting.
     */
    setProfileSetting = <TSetting>(profile: IProfile, key: string, value: TSetting) => {
        var profileId = selectors.activeProfile(this.state)?.id
        if (profileId !== undefined && this.state.persistent.profiles[profileId].features !== undefined) {
            this.store.dispatch(actions.setFeature(profileId, key, value));
            // this.state.persistent.profiles[profileId].features[key] = value;
            var features = this.state.persistent.profiles[profileId]?.features;
            log('debug', `attempting to set ${key}/${value} in ${profile.name}`, features);
        }
    }

    /**
     * Retrieves the value of a given profile feature/setting on a given profile.
     * 
     * @param profile The profile to retreive the value from.
     * @param key The unique key for the profile feature/setting.
     * @param defaultValue The default value to return if the feature does not exist or does not have a value.
     */
    getProfileSetting<TSetting>(profile: IProfile, key: string, defaultValue: TSetting) : TSetting;
    getProfileSetting<TSetting>(key: string, defaultValue: TSetting) : TSetting;
    getProfileSetting<TSetting>(profileOrKey: string | IProfile, defaultValueOrKey: string | TSetting, defaultValue?: TSetting) : TSetting {
        if (typeof profileOrKey === 'string') { // have to get our own profile
            var key = profileOrKey as string;
            defaultValue = defaultValueOrKey as TSetting; // this can actually be undefined which is probably not good.
            var profileId = selectors.activeProfile(this.state)?.id
            if (profileId !== undefined) {
                var features = this.state.persistent.profiles[profileId]?.features;
                const skipTerms = features ? features[key] : defaultValue;
                return skipTerms;
            }
            return defaultValue; // this should only happen if we can't get the profile for some reason.
        } else {
            //we've got a profile already
            var profile = profileOrKey as IProfile;
            var key = defaultValueOrKey as string;
            var profileFeatures = profile.features;
            const skipTerms = profileFeatures ? profileFeatures[key] : defaultValue;
            return skipTerms;
        }
    }
}