import { FundData } from "../models/models";
import * as MathHelpers from "./math-helpers";

var log2 = Math.log(2);

/**
 * for each FundData, filters it to just DayNumbers shared by all the provided fundDatas
 */
export function getIntersectionFundDatas(fundDatas: FundData[], forceStartDayNumber: number | null = null): FundData[] {
    if (fundDatas.length === 0) return [];
    var maxStartDayNumber = Math.max(...fundDatas.map(z => z.startDayNumber));
    if (forceStartDayNumber != null){
        maxStartDayNumber = Math.max(maxStartDayNumber, forceStartDayNumber);
    }
    var minEndDayNumber = Math.min(...fundDatas.map(z => z.startDayNumber + z.values.length));
    return fundDatas.map(fundData => {
        var trimStart = maxStartDayNumber - fundData.startDayNumber;
        var trimEnd = (fundData.startDayNumber + fundData.values.length) - minEndDayNumber;
        var newValues = new Float32Array(fundData.values.length - trimStart - trimEnd);
        for (var i = trimStart; i < fundData.values.length - trimEnd; i++){
            newValues[i - trimStart] = fundData.values[i];
        }
        return {
            startDayNumber: maxStartDayNumber,
            dataType: "price",
            values: newValues
        };
    });
}

/**
 * Finds the first DayNumber shared by all the provided fundDatas
 */
export function getFirstCommonDayNumber(fundDatas: FundData[]): number {
    var common = fundDatas[0].startDayNumber;
    for(var i = 1; i < fundDatas.length; i++){
        common = Math.max(common, fundDatas[i].startDayNumber);
    }
    return common;
}

export function getReturns(fundData: FundData, returnDays: number): FundData {
    var newValues = new Float32Array(fundData.values.length - returnDays);
    for (var i = returnDays; i < fundData.values.length; i++) {
        newValues[i - returnDays] = fundData.values[i] / fundData.values[i - returnDays];
    }
    return {
        startDayNumber: fundData.startDayNumber + returnDays,
        values: newValues
    };
}

export function getLogReturns(fundData: FundData): FundData {
    var newValues = new Float32Array(fundData.values.length);
    for (var i = 0; i < newValues.length; i++){
        newValues[i] = Math.log(fundData.values[i]) / log2;
    }
    return {
        startDayNumber: fundData.startDayNumber,
        values: newValues
    };
}


export function getEqualizePrices(fundData: FundData, firstCommonDayNumber: number): FundData {
    var daysToCommon = firstCommonDayNumber - fundData.startDayNumber
    if (fundData.values.length <= daysToCommon){
        console.warn("unable to properly getEqualizePrices (out of range)")
        return fundData;
    }
    var commonPrice = fundData.values[daysToCommon];
    var factor = 10 / commonPrice;
    var newValues = new Float32Array(fundData.values.length);
    for (let i = 0; i < newValues.length; i++) {
        newValues[i] = fundData.values[i] * factor;
    };
    return {
        values: newValues,
        startDayNumber: fundData.startDayNumber,
    }
}


export function getExponentReturns(fundData: FundData): FundData {
    var newValues = new Float32Array(fundData.values.length);
    for (var i = 0; i < newValues.length; i++){
        newValues[i] =  Math.pow(2, fundData.values[i])
    }
    return {
        startDayNumber: fundData.startDayNumber,
        values: newValues
    };
}

export function getExtrapolatedReturns(fundData: FundData, returnDays: number, extrapolateDays: number): FundData {
    var exponent = extrapolateDays / returnDays;
    var newValues = new Float32Array(fundData.values.length);
    for (var i = 0; i < newValues.length; i++){
        newValues[i] =  Math.pow(fundData.values[i], exponent)
    }
    return {
        startDayNumber: fundData.startDayNumber,
        values: newValues
    };
}

export function getLosses(fundData: FundData): FundData {
    var newValues = new Float32Array(fundData.values.length);
    for (var i = 0; i < newValues.length; i++){
        newValues[i] =  Math.min(0, fundData.values[i]);
    }
    return {
        startDayNumber: fundData.startDayNumber,
        values: newValues
    };
}

export function getSmoothData(fundData: FundData, smoothDays: number): FundData {
    var oldValues = fundData.values
    var newValues = new Float32Array(oldValues.length);
    var sum = 0;
    var count = 0;
    var sideDays = Math.floor(smoothDays / 2);
    smoothDays = sideDays * 2 + 1;//in effect, smoothDays is just rounded down to the nearest odd number
    var leftIndex = 0;;
    var rightIndex = sideDays;
    for (var i = 0; i <= rightIndex; i++) {
        sum += oldValues[i];
        count++;
    }
    for (var i = 0; i < oldValues.length - 1; i++) {
        newValues[i] = sum / count;
        if (isNaN(newValues[i])){
            console.warn("Some errors occured in the calculation. Likely involving infinity and some extremely inputs");
            sum = 0;
            newValues[i] = 0;
        }
        if (leftIndex == i - sideDays){
            sum -= oldValues[leftIndex];
            leftIndex++;
        } else {
            count++;
        }
        if (rightIndex == oldValues.length - 1){
            count--;
        } else {
            rightIndex++;
            sum += oldValues[rightIndex];
        }
    }
    newValues[newValues.length - 1] = sum / count
    return {
        startDayNumber: fundData.startDayNumber,
        values: newValues
    };
}


export function getUnionDayNumbers(fundDatas: FundData[]): number[] {
    var minDayNumber = Math.min(...fundDatas.map(z => z.startDayNumber));
    var maxDayNumber = Math.max(...fundDatas.map(z => z.startDayNumber + z.values.length));
    var dayNumbers = new Array<number>(1 + maxDayNumber - minDayNumber);
    for (var i = minDayNumber; i <= maxDayNumber; i++){
        dayNumbers[i - minDayNumber] = i;
    }
    return dayNumbers;
}

/**
 * Converts the funddata.values to a number array that's aligned with the dayNumbers. 
 * @param dayNumbers A list of dayNumbers. Determines the output array length
 * @returns a list a (number | null)[] who's length will match the length of dayNumbers.length
 */
export function matchDataToDayNumbers(dayNumbers: number[], fundData: FundData | null): (number | null)[] {
    if (fundData == null){
        return dayNumbers.map(_ => null);
    }
    var output: (number | null)[] = [];
    for (var dayNumber of dayNumbers) {
        if (dayNumber >= fundData.startDayNumber && dayNumber <= (fundData.startDayNumber + fundData.values.length - 1)){
            output.push(fundData.values[dayNumber - fundData.startDayNumber]);
        } else {
            output.push(null);
        }
    }
    return output;
}

/**
 * Gets the average annual factor return
 */
export function getAvgAfr(fundData: FundData): number {
    var lastVal = fundData.values[fundData.values.length - 1];
    var dayDiff = fundData.values.length;
    var avgAfr = ((lastVal / fundData.values[0]) ** (365 / dayDiff));
    return avgAfr;
}

/**
 * gets a copy of the array that only includes every nth item
 */
export function everyNthItem<T>(arr: T[], n: number): T[] {
    var output: T[] = [];
    for (let i = 0; i < arr.length; i += n) {
        output.push(arr[i]);
    }
    return output;
}

/**
 * gets the value of the portfolio over time, assuming we started with $10
 * @param fundDatas a list of a list of fundData
 * @param weights a list of weights for desired holding of each stock. Magnitude doesn't matter, just relative proportion
 * @param rebalanceDays how often (in days) the portfolio's holdings should be redistributed to match the weights
 */
export function getPortfolioFundData(fundDatas: FundData[], weights: number[], rebalanceDays: number): FundData {
    if (Math.min(...fundDatas.map(z => z.values.length)) != Math.max(...fundDatas.map(z => z.values.length))) {
        throw "all fundDatas must have the same values length";
    }
    if (Math.min(...fundDatas.map(z => z.startDayNumber)) != Math.max(...fundDatas.map(z => z.startDayNumber))) {
        throw "all fundDatas must have the same startDayNumber";
    }
    if (fundDatas.length != weights.length) {
        throw "weights.length must match fundDatas.length";
    }
    if (!fundDatas.length) {
        throw "fundDatas is empty";
    }
    var sumWeight = MathHelpers.getSum(weights);
    var startMoney = 10;
    var shares: number[] = [];//stores how many shares we have of each fund
    var newValues = new Float32Array(fundDatas[0].values.length);
    for (var i = 0; i < weights.length; i++) {
        var moneyForCurrentFund = weights[i] / sumWeight * startMoney;
        shares.push(moneyForCurrentFund / fundDatas[i].values[0])
    }
    var lastRebalanceIndex = 0;
    for (var i = 0; i < fundDatas[0].values.length; i++) {
        var sumMoney = 0;
        for (var j = 0; j < shares.length; j++) {
            sumMoney += fundDatas[j].values[i] * shares[j];
        }
        if (i - lastRebalanceIndex == rebalanceDays) {
            for (var j = 0; j < weights.length; j++) {
                var moneyForCurrentFund = weights[j] / sumWeight * sumMoney;
                shares[j] = moneyForCurrentFund / fundDatas[j].values[i]
            }
            lastRebalanceIndex = i;
        }
        newValues[i] = sumMoney;
    }
    return {
        startDayNumber: fundDatas[0].startDayNumber,
        values: newValues
    };
}

export function getMaxDrawdown(fundData: FundData, daysMaintained: number): { drawdown: number, fundData: FundData } | null {
    var windowMax = -1/0;
    var windowMin = 1/0
    var windowStartInd = 0
    for (var i = 0; i < daysMaintained; i++){
        windowMax = Math.max(windowMax, fundData.values[i])
        windowMin = Math.min(windowMin, fundData.values[i])
    }

    var peakVal = windowMin;
    var peakStartInd = windowStartInd;
    var maxDrawdown = 0;
    var drawdownStartInd: number | null = null;
    var drawdownEndInd: number | null = null;

    for (var i = daysMaintained; i < fundData.values.length; i++){
        var recalcNeeded = (fundData.values[windowStartInd] == windowMin && fundData.values[i] > windowMin) 
            || (fundData.values[windowStartInd] == windowMax && fundData.values[i] < windowMax);
        windowStartInd++;
        if (recalcNeeded){
            var windowMax = -1/0;
            var windowMin = 1/0
            for (var j = windowStartInd; j <= i; j++){
                windowMax = Math.max(windowMax, fundData.values[j])
                windowMin = Math.min(windowMin, fundData.values[j])
            }
        } else {
            windowMax = Math.max(windowMax, fundData.values[i])
            windowMin = Math.min(windowMin, fundData.values[i])
        }

        var drawdown = (peakVal - windowMax) / peakVal;
        if (drawdown > maxDrawdown){
            maxDrawdown = drawdown;
            drawdownStartInd = peakStartInd;
            drawdownEndInd = i;
        }
        if (windowMin >= peakVal) {
            peakVal = windowMin;
            peakStartInd = windowStartInd;
        }
    }

    if (drawdownStartInd != null && drawdownEndInd != null) {
        var newValues = new Float32Array(1 + drawdownEndInd - drawdownStartInd);
        for (var i = drawdownStartInd; i <= drawdownEndInd; i++){
            newValues[i - drawdownStartInd] = fundData.values[i];
        }
        return {
            drawdown: maxDrawdown,
            fundData: {
                startDayNumber: fundData.startDayNumber + drawdownStartInd,
                values: newValues
            }
        };
    }
    return null;
}