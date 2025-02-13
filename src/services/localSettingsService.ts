import { LineChartDataInputs, PortfolioTicker, ScatterplotAxisInputs, StatInputs } from "../models/models";

export type LocalSettings = { 
    tickers?: string | undefined,
    returnDays?: number | undefined,
    smoothDays?: number | undefined,
    renderFrequency?: number | undefined,
    segmentCount?: number | undefined,
    filterExpr?: string | undefined,
    highlightExpr?: string | undefined,
    lineChartInputs1?: LineChartDataInputs | undefined,
    lineChartInputs2?: LineChartDataInputs | undefined,
    scatterplotAxisInputsX?: ScatterplotAxisInputs | undefined,
    scatterplotAxisInputsY?: ScatterplotAxisInputs | undefined,
    statInputs?: StatInputs | undefined,
    forceStartYearEnabled?: boolean | undefined,
    forceStartYear?: number | null | undefined,
    includePure?: boolean | undefined,
    rebalanceDays?: number | undefined,
    portfolioTickers?: PortfolioTicker[] | undefined,
}

class LocalSettingsService {
    private localSettings: LocalSettings;
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