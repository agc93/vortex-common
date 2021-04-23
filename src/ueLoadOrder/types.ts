import { IMod } from "vortex-api/lib/types/api";

export interface ISerializableData {
    // The prefix we want to add to the folder name on deployment.
    prefix: string;
  }
   
  export interface ILoadOrderEntry {
    // An arbitrary unique Id.
    id: string;
   
    // This property is required by the FBLO API functors.
    //  This game will not be using checkboxes so we're just going to
    //  assign "true" when we build the load order entry instance.
    enabled: boolean;
   
    // Human readable name for the mod - this is what we display to the user
    //  in the load order page.
    name: string;
   
    // The modId as stored by Vortex in its application state. Remember, in
    //  other games, 1 modId could have several mod entries in the load order
    //  page that are tied to it. That's why we have two separate id properties.
    modId?: string;
  
    // Any additional data we want to store in the load order file.
    //  this is where we’re going to store our prefix.
    data?: ISerializableData;
  }

  export type LoadOrderFilter = (value: ILoadOrderEntry, mod?: IMod) => boolean;