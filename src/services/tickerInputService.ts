import { Reactive, reactive, watch } from "vue";
import { TickerInputs } from "../models/models";
import { localSettingsService } from "./localSettingsService";

export var tickerInputs: Reactive<TickerInputs> = reactive({
    tickers: (localSettingsService.getValue("tickers") || "VFIAX VBTLX GLD AMZN $examplePortfolio")
});

watch(() => tickerInputs.tickers, () => {
    localSettingsService.setValue("tickers", tickerInputs.tickers);
});