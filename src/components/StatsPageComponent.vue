<script setup lang="ts">

import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { reactive, Reactive, Ref, ref, watch } from 'vue'
import { debounce } from '../services/debouncer';
import { FundData, StatInputs } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { localSettingsService } from '../services/localSettingsService';
import * as PriceHelpers from '../services/price-helpers';
import * as MathHelpers from '../services/math-helpers';
import * as MatrixHelpers from '../services/matrix-helpers';
import { getSD } from '../services/math-helpers';

type TickerStats = {
    ticker: string,
    description: string,
    createDate: string,
    startPrice: string,
    endPrice: string,
    return: number,
    maxDrawdown: string,
    sd: number,
    rms: number
}

var tickerArray: Ref<string[] | null> = ref(null);
var inputs: Reactive<StatInputs> = reactive(localSettingsService.getValue("statInputs") || { mode: "logReturns", returnDays: 30, smoothDays: 30, extrapolateDays: 365, drawdownDays: 1, dateFilterMode: "No Filters"});
var tickerStats: Ref<TickerStats[]> = ref([]);
var sdMatrix: Ref<number[][]> = ref([]);
var rmsMatrix: Ref<number[][]> = ref([]);
var dateFilterMessage = ref<string>("");


async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z0-9_$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;
    var priceHistoryPromises = tempTickerArray.map(z => getPriceHistory(z));
    var fundDatas = await Promise.all(priceHistoryPromises);
    var descriptions = fundDatas.map(fundData => fundData.description);
    var createDates = fundDatas.map(fundData => new Date(fundData.startDayNumber * 86400000));
    if (inputs.dateFilterMode == "Common Start Date"){
        var commonDayNumber = PriceHelpers.getFirstCommonDayNumber(fundDatas);
        fundDatas = fundDatas.map(fundData => PriceHelpers.filterFundData(fundData, commonDayNumber));
        dateFilterMessage.value = "filtered to " + new Date(commonDayNumber * 86400000).toISOString().split('T')[0];
    } else if (!isNaN(parseFloat(inputs.dateFilterMode))){
        var years = parseFloat(inputs.dateFilterMode)
        var todayDayNumber = Math.floor((new Date()).getTime() / 86400000);
        var startDayNumber = todayDayNumber - Math.floor(years * 365.25);
        fundDatas = fundDatas.map(fundData => PriceHelpers.filterFundData(fundData, startDayNumber));
        dateFilterMessage.value = "filtered to " + new Date(startDayNumber * 86400000).toISOString().split('T')[0];
    } else {
        dateFilterMessage.value = ""
    }
    var tickerStatsArray: TickerStats[] = [];
    var logReturns: FundData[] = [];
    var logLosses: FundData[] = [];
    for (var i = 0; i < fundDatas.length; i++){
        var fundData = fundDatas[i];
        var afr = PriceHelpers.getAvgAfr(fundData);
        var maxDrawdown = PriceHelpers.getMaxDrawdown(fundData, inputs.drawdownDays)?.drawdown;
        fundData = PriceHelpers.getReturns(fundData, inputs.returnDays);
        fundData = PriceHelpers.getExtrapolatedReturns(fundData, inputs.returnDays, inputs.extrapolateDays);
        fundData = PriceHelpers.getLogReturns(fundData);
        fundData = PriceHelpers.getSmoothData(fundData, inputs.smoothDays);
        logReturns.push(fundData);
        var sd = getSD(Array.from(fundData.values));
        var fundDataLosses = PriceHelpers.getLosses(fundData);
        logLosses.push(fundDataLosses)
        var rms = MathHelpers.getRMS(Array.from(fundDataLosses.values));
        tickerStatsArray.push({
            ticker: tempTickerArray[i],
            description: descriptions[i] ?? "",
            createDate: createDates[i].toLocaleString('en-US', { month: 'short' }) + " " + createDates[i].getFullYear(),
            startPrice: "$" + fundDatas[i].values[0].toFixed(2),
            endPrice: "$" + fundDatas[i].values[fundDatas[i].values.length - 1].toFixed(2),
            return: afr,
            sd: (sd || 0),
            rms: (rms || 0),
            maxDrawdown: maxDrawdown != null ? (Math.round(maxDrawdown * 1000) / 10) + "%" : "(none)",
        });
    }
    tickerStats.value = tickerStatsArray;
    sdMatrix.value = MatrixHelpers.getCorrelationMatrix(logReturns)
    rmsMatrix.value = MatrixHelpers.getCorrelationMatrix(logLosses, true);
}

watch(() => tickerInputs.tickers, () => {
    debounce("a", 1000, () => updateData());
});

watch(inputs, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("statInputs", inputs)
});

updateData()

function roundTo2 (num: number) { 
    return num == 1 ? 1 : num.toFixed(2) 
}
function afrToPercent (afr: number) { 
    return (Math.round((afr - 1) * 1000) / 10) + "%"
}
function logAfrToPerecent (logAfr: number) {
    return (Math.round((2**logAfr - 1) * 1000) / 10) + "%"
}

function getColorOpacity(r: number): string {
    return "--cell-opacity: " + Math.abs(r);
}
function getCosineColorOpacity(r: number): string {
    return "--cell-opacity: " + Math.abs(r - 0.5) * 2;
}
</script>

<template>
    <div style="padding: 4px 12px;">
        <TickerInputComponent/>
        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <div>
                <label>Return Period</label>
                <br>
                <input v-model.number="inputs.returnDays">
            </div>
            <div>
                <label>Smooth N Days</label>
                <br>
                <input v-model.number="inputs.smoothDays">
            </div>
            <div>
                <label>Return Extrapolation</label>
                <br>
                <input v-model.number="inputs.extrapolateDays">
            </div>
            <div>
                <label>drawdown days maintained</label>
                <br>
                <input v-model.number="inputs.drawdownDays">
            </div>
            <div>
                <label>Date Filter</label>
                <br>
                <select v-model="inputs.dateFilterMode">
                    <option>No Filters</option>
                    <option>Common Start Date</option>
                    <option>1 year ago</option>
                    <option>5 years ago</option>
                    <option>10 years ago</option>
                    <option>15 years ago</option>
                </select>
            </div>
        </div>
        <div v-if="dateFilterMessage" style="font-size: 0.75em;">{{ dateFilterMessage }}</div>
        <div style="display: flex; justify-content: left;">
            <div style="display: grid; grid-template-columns: repeat(9, auto); gap: 2px 16px;">
                <h4>Ticker</h4>
                <h4>Description</h4>
                <h4>Created</h4>
                <h4>Start Price<span v-if="dateFilterMessage">*</span></h4>
                <h4>End Price</h4>
                <h4>Avg APR</h4>
                <h4>Std Dev</h4>
                <h4>Loss RMS</h4>
                <h4>Max Drawdown</h4>
                <template v-for="(tickerStat) in tickerStats">
                    <div>{{ tickerStat.ticker }}</div>
                    <div>{{ tickerStat.description }}</div>
                    <div>{{ tickerStat.createDate }}</div>
                    <div style="text-align: right;">{{ tickerStat.startPrice }}</div>
                    <div style="text-align: right;">{{ tickerStat.endPrice }}</div>
                    <div>{{ afrToPercent(tickerStat.return) }}</div>
                    <div>{{ logAfrToPerecent(tickerStat.sd) }}</div>
                    <div>{{ logAfrToPerecent(tickerStat.rms) }}</div>
                    <div>{{ tickerStat.maxDrawdown }}</div>
                </template>
            </div>
        </div>
        <div style="display: flex; gap: 48px; margin-top: 24px;">
            <div>
                <h4 style="text-align: center;">Log Return Correlations</h4>
                <table v-if="sdMatrix">
                    <tr>
                        <td style="padding: 0 4px;"></td>
                        <td style="padding: 0 4px;" v-for="ticker in tickerArray">{{ ticker }}</td>
                    </tr>
                    <tr v-for="(ticker, index) in tickerArray">
                        <td style="padding: 0 4px;">{{ ticker }}</td>
                        <td style="padding: 0 4px;" v-for="(r) in sdMatrix![index]" :style="getColorOpacity(r)"
                            :class="{'bad-cell': r > 0, 'good-cell': r < 0}" >{{ roundTo2(r) }}</td>
                    </tr>
                </table>
            </div>
            <div>
                <h4 style="text-align: center;">Log Losses Cosine Similarity</h4>
                <table v-if="rmsMatrix">
                    <tr>
                        <td style="padding: 0 4px;"></td>
                        <td style="padding: 0 4px;" v-for="ticker in tickerArray">{{ ticker }}</td>
                    </tr>
                    <tr v-for="(ticker, index) in tickerArray">
                        <td style="padding: 0 4px;">{{ ticker }}</td>
                        <td style="padding: 0 4px;" v-for="r in rmsMatrix![index]" :style="getCosineColorOpacity(r)"
                        :class="{'bad-cell': r > 0.5, 'good-cell': r < 0.5}">{{ roundTo2(r) }}</td>
                    </tr>
                </table>
            </div>
        </div>

    </div>

</template>

<style scoped>
.bad-cell {
  background-color: rgba(117, 25, 25, var(--cell-opacity)) !important;
}

.good-cell {
  background-color: rgba(40, 100, 40, var(--cell-opacity)) !important;
}

</style>
