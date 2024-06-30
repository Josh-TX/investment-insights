
export type LocalSettings = {
    returnDays?: number | undefined,
    smoothDays?: number | undefined,
    syncDays?: boolean | undefined,
    tickers?: string | undefined,
    filterDays?: string | undefined,
    segmentCount?: number | undefined
}

class LocalSettingsService {
    private localSettings: LocalSettings

    constructor() { 
        var storedStr = localStorage["local-settings"];
        if (storedStr){
            this.localSettings = JSON.parse(storedStr);
        } else {
            this.localSettings = {};
        }
    }
    setValue<K extends keyof LocalSettings>(key: K, val: LocalSettings[K]){
        this.localSettings[key] = val;
        localStorage["local-settings"] = JSON.stringify(this.localSettings);
    } 

    getValue<K extends keyof LocalSettings>(key: K): LocalSettings[K]{
        return this.localSettings[key]
    }
}

export var localSettingsService = new LocalSettingsService();