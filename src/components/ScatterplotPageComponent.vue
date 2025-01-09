<script setup lang="ts">

//import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { Reactive, reactive, ref, shallowRef, ShallowRef, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { ScatterplotAxisInputs, ScatterplotDataContainer } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import ScatterplotChart from './ScatterplotChart.vue';
import { debounce } from '../services/debouncer';
import { getScatterplotDataContainer } from '../services/scatterplotBuilder';
import ScatterplotInputComponent from './ScatterplotInputComponent.vue';
import { portfolioService } from '../services/portfolioService';
import * as ExpressionHelpers from "../services/expression-helpers";


var segmentCount = ref(localSettingsService.getValue("segmentCount") ?? 5);
var filterExpr = ref(localSettingsService.getValue("filterExpr") ?? "AMZN < 4 and $examplePortfolio in [0,5]");
var highlightExpr = ref(localSettingsService.getValue("highlightExpr") ?? "");
var dataContainer = ref<ScatterplotDataContainer | null>(null);
var includePure = ref<boolean>(localSettingsService.getValue("includePure") ?? false);
var forceStartYearEnabled = ref<boolean>(localSettingsService.getValue("forceStartYearEnabled") ?? false);
var forceStartYear = ref<number | null>(localSettingsService.getValue("forceStartYear") ?? null);
var startDateMessage = ref<string>("");
var startDateWarning = ref<boolean>(false);
var regenerateNeeded = ref<boolean>(true);
var rebalanceDays = ref<number>(localSettingsService.getValue("rebalanceDays") ?? 365);

var axisInputsY: Reactive<ScatterplotAxisInputs> = reactive(localSettingsService.getValue("scatterplotAxisInputsY") || { mode: "return", returnDays: 30, smoothDays: 30, drawdownDays: 1, riskAdjSD: -0.5});
var axisInputsX: Reactive<ScatterplotAxisInputs> = reactive(localSettingsService.getValue("scatterplotAxisInputsX") || { mode: "logReturnSD", returnDays: 30, smoothDays: 30, drawdownDays: 1, riskAdjSD: -0.5});
var highlightedIndexes: ShallowRef<number[]> = shallowRef([]);
var selectedWeightss: ShallowRef<number[][]> = shallowRef([]);
var _errorDebounce = false;

watch(segmentCount, () => {
    localSettingsService.setValue("segmentCount", segmentCount.value);
    regenerateNeeded.value = true;
});
watch(filterExpr, () => {
    localSettingsService.setValue("filterExpr", filterExpr.value);
    regenerateNeeded.value = true;
});
watch(forceStartYearEnabled, () => {
    localSettingsService.setValue("forceStartYearEnabled", forceStartYearEnabled.value);
    regenerateNeeded.value = true;
});
watch(forceStartYear, () => {
    localSettingsService.setValue("forceStartYear", forceStartYear.value);
    regenerateNeeded.value = true;
});
watch(includePure, () => {
    localSettingsService.setValue("includePure", includePure.value);
    regenerateNeeded.value = true;
});
watch(rebalanceDays, () => {
    localSettingsService.setValue("rebalanceDays", rebalanceDays.value);
    regenerateNeeded.value = true;
});
watch(highlightExpr, () => {
    localSettingsService.setValue("highlightExpr", highlightExpr.value);
    _errorDebounce = false;
    debounce("highlightExpr", 1000, updateHighlightedIndexes)
});
watch(axisInputsX, () => {
    localSettingsService.setValue("scatterplotAxisInputsX", axisInputsX);
    regenerateNeeded.value = true;
});
watch(axisInputsY, () => {
    localSettingsService.setValue("scatterplotAxisInputsY", axisInputsY);
    regenerateNeeded.value = true;
});
watch(() => tickerInputs.tickers, () => {
    regenerateNeeded.value = true;
})


async function generate() {
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z0-9_$]+/).filter(z => !!z);
    if (filterExpr.value){
        var error = ExpressionHelpers.getExpressionErrors(filterExpr.value, tickerArray);
        if (error){
            alert("filter " + error);
            return;
        }
    }
    var promises = tickerArray.map(z => getPriceHistory(z));
    var fundDatas = await Promise.all(promises);
    var forceStartDayNumber = forceStartYearEnabled.value && forceStartYear.value != null ? Math.floor(new Date(forceStartYear.value, 0, 1).getTime() / 86400000) : null;
    var newestIndex = fundDatas.reduce((prev, fundData, i) => fundData.startDayNumber > fundDatas[prev].startDayNumber ? i : prev, 0);
    startDateWarning.value = false;
    if (forceStartDayNumber != null && forceStartDayNumber > fundDatas[newestIndex].startDayNumber){
        if (forceStartYear.value! > new Date().getFullYear()){
            alert("invalid year");
            return;
        }
        startDateMessage.value = "force start " +  new Date(forceStartDayNumber * 86400000).toISOString().split('T')[0];
    } else {
        startDateMessage.value = tickerArray[newestIndex] + " started " +  new Date(fundDatas[newestIndex].startDayNumber * 86400000).toISOString().split('T')[0];
        var twoYearsPrior = fundDatas[newestIndex].startDayNumber - (365 * 2);
        if (forceStartYearEnabled.value){
            startDateWarning.value = true;
        } else if (fundDatas.filter(z => z.startDayNumber >= twoYearsPrior).length == 1){
            startDateWarning.value = true; //no other funds are within 2 years of the most recent
        }
    }
    regenerateNeeded.value = false;
    dataContainer.value =  await getScatterplotDataContainer(tickerArray, fundDatas, segmentCount.value, filterExpr.value, axisInputsX, axisInputsY, rebalanceDays.value, includePure.value, forceStartDayNumber);
    updateHighlightedIndexes();
}


function updateHighlightedIndexes() {
    if (!dataContainer.value) {
        return;
    }
    highlightedIndexes.value = [];
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    if (highlightExpr.value) {
        var error = ExpressionHelpers.getExpressionErrors(highlightExpr.value, tickerArray);
        if (error){
            //don't want to interupt the user while typing, so give another them second
            if (!_errorDebounce){
                _errorDebounce = true;
                debounce("highlightExpr", 1000, updateHighlightedIndexes);
                return;
            } else {
                alert("highlight " + error);
                return;
            }
        }

        var parsedExpr = ExpressionHelpers.getExpression(highlightExpr.value);
        var lowercaseTickers = tickerArray.map(z => z.toLowerCase());
        var loggedError = false;
        for (var i = 0; i < dataContainer.value.points.length; i++) {
            var point = dataContainer.value.points[i];
            var exprData: { [ticker: string]: number } = {};
            for (var j = 0; j < lowercaseTickers.length; j++) {
                exprData[lowercaseTickers[j]] = point.weights[j];
            }
            try {
                var passesFilter = parsedExpr.evaluate(exprData);
                if (passesFilter) {
                    highlightedIndexes.value.push(i);
                }
            } catch (e) {
                if (!loggedError) {
                    console.error(e);
                    loggedError = true;
                }
            }
        }
    }
}

function createPortfolio(){
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z0-9_$]+/).filter(z => !!z);
    portfolioService.startAddFromScatterplot(tickerArray, selectedWeightss.value[0]);
}

function getTitle(axis: "x" | "y"): string{
    var inputs = axis == "x" ? axisInputsX : axisInputsY;
    if (inputs.mode == "maxDrawdown"){
        return "Max Drawdown (" + inputs.drawdownDays + ")";
    } 
    if (inputs.mode == "return"){
        return `Return`;
    }
    if (inputs.mode == "logLossRMS"){
        return `Log Loss Root Mean Square (${inputs.returnDays}, ${inputs.smoothDays})`;
    }
    if (inputs.mode == "logReturnSD"){
        return `Log Return Standard Deviation (${inputs.returnDays}, ${inputs.smoothDays})`;
    }
    throw "unknown mode";
}

function getSelectedPortfolioLabel(weights: number[]){
    var label = "";
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    for (var i = 0; i < tickerArray.length; i++){
        if (weights[i] > 0){
            label += tickerArray[i] + ": " + weights[i] + ", ";
        }
    }
    return label.substring(0, label.length - 2);
}

async function pointClicked(weightss: number[][]) {
    selectedWeightss.value = [...weightss];
}

</script>

<template>
    <div style="display: flex; flex-direction: column; height: 100%; padding: 4px 12px;">
        <TickerInputComponent />
        <div style="display: flex; width: 100%; margin-top: 8px; gap: 12px;">
            <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055; display: flex">
                <div class="y-axis-input-label">Y-axis</div>
                <ScatterplotInputComponent v-model:inputs="axisInputsY"></ScatterplotInputComponent>
            </div>
            <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055; display: flex; align-items: center;">
                <div style="line-height: 1rem; margin-right: 8px;">X-axis</div>
                <ScatterplotInputComponent v-model:inputs="axisInputsX"></ScatterplotInputComponent>
            </div>
        </div>
        <div style="display: flex; gap: 16px;">
            <div>
                <label>Segment Count</label>
                <br>
                <select v-model="segmentCount">
                    <option :value="4">4 (25% per segment)</option>
                    <option :value="5">5 (20% per segment)</option>
                    <option :value="6">6 (16.66% per segment)</option>
                    <option :value="8">8 (12.5% per segment)</option>
                    <option :value="10">10 (10% per segment)</option>
                    <option :value="12">12 (8.33% per segment)</option>
                    <option :value="16">16 (6.25% per segment)</option>
                    <option :value="20">20 (5% per segment)</option>
                </select>
            </div>
            <div>
                <label>Rebalance Every</label>
                <br>
                <div class="input-wrapper">
                    <input style="max-width: 120px;;" v-model="rebalanceDays">
                    <span class="input-wrapper-text">days</span>
                </div>
            </div>
            <div>
                <label><input type="checkbox" class="checkbox-fix" v-model="forceStartYearEnabled" style="margin: 0 6px 0 0;">Force Start Year</label>
                <br>
                <input type="number" style="max-width: 125px;" :disabled="!forceStartYearEnabled" :placeholder="forceStartYearEnabled ? '' : '(disabled)'" v-model="forceStartYear">
            </div>
            <div class="invisible" :class="{'visible': !!filterExpr}" style="text-align: center;;">
                <label>&nbsp;</label>
                <br>
                <label><input type="checkbox" class="checkbox-fix" v-model="includePure">Include pure portfolios</label>
            </div>
            <div style="flex: 1;">
                <label>Filter Portfolios by Expression</label>
                <br>
                <input v-model="filterExpr" style="width: 100%">
            </div>
            <div style="padding-top: 7px">
                <button @click="generate" style="margin-bottom: -1px;" :class="{primary: regenerateNeeded}">Generate</button>
            </div>
        </div>
        <div class="h1" style="margin: 8px 0 2px 0;"></div>
        <div style="display: flex; gap: 16px;">
            <div style="flex: 1;">
                <label>Highlight Portfolios by Expression</label>
                <br>
                <input v-model="highlightExpr" style="width: 100%">
            </div>
            <div style="flex: 1; display: flex;" class="invisible" :class="{'visible': !!selectedWeightss.length}">
                <div style="flex: 1;">
                    <label>Selected Portfolio</label>
                    <br>
                    <span v-if="selectedWeightss.length" style="font-weight: 500; color: #aaa;">{{ getSelectedPortfolioLabel(selectedWeightss[0]) }}</span>
                </div>
                <div>
                    <button @click="createPortfolio">Create Portfolio Ticker</button>
                </div>
            </div>
        </div>
        <div class="scatterplot-container">
            <ScatterplotChart :dataContainer="dataContainer" :highlightedIndexes="highlightedIndexes" @point-clicked="pointClicked">
            </ScatterplotChart>
            <div v-if="startDateMessage" class="start-date-label" :class="{warning: startDateWarning}">{{ startDateMessage }}</div>
            <h2 v-if="!dataContainer" class="not-generated-msg">Click "Generate" to compute possible portfolios</h2>
            <div style="position: absolute; left: 0; width: 30px; top: 0; bottom: 30px;" class="y-label-container">
                <span class="color-label y-label-top good" v-if="axisInputsY.mode == 'return'">better</span>
                <span class="color-label y-label-top bad" v-else>worse</span>
                <span> {{ getTitle('y') }}</span>
                <span class="color-label y-label-bottom good" v-if="axisInputsY.mode != 'return'">better</span>
                <span class="color-label y-label-bottom bad" v-else>worse</span>
            </div>
            <div style="position: absolute; bottom: 0; height: 30px; left: 30px; right: 0;" class="x-label-container">
                <span class="color-label x-label-left good" v-if="axisInputsX.mode != 'return'">better</span>
                <span class="color-label x-label-left bad" v-else>worse</span>
                <span> {{ getTitle('x') }}</span>
                <span class="color-label x-label-right good" v-if="axisInputsX.mode == 'return'">better</span>
                <span class="color-label x-label-right bad" v-else>worse</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scatterplot-container{
    flex: 1 0 0; 
    min-height: 1px; 
    position: relative; 
    min-height: 350px; 
    padding-left: 30px; 
    padding-bottom: 30px;
}

.color-label {
  position: absolute;
  z-index: -1;
  opacity: 0.7;
}
.good{
    color: green;
}
.bad{
    color: red;
}

.y-axis-input-label {
    position: relative;
    writing-mode: vertical-rl;
    transform: rotate(180deg); 
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 5px;
}

.y-label-container {
    position: relative;
    writing-mode: vertical-rl;
    transform: rotate(180deg); 
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0 50px 0;
}
.y-label-top {
    bottom: 0;
}
.y-label-bottom {
    top: 0;
}

.x-label-container {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 0 10px 0 50px;
}
.x-label-left {
    left: 0;
}
.x-label-right {
    right: 0;
}

.not-generated-msg{
    position: absolute;
    top: 40%;
    text-align: center;
    left: 0;
    right: 0;
    opacity: 0.4;
}

.start-date-label {
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0.6;
}

.checkbox-fix{
    position: relative;
    top: 1px;
}

.warning{
    color: rgb(255, 255, 103)
}

.primary{
    background-color: #086eb3;
}
</style>
