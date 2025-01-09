import * as MathHelpers from "./math-helpers";
import * as ExpressionHelpers from "./expression-helpers"
import type { Expression } from "expr-eval";

export class WeightsGenerator{

    private _tickers: string[] = [];
    private _filterExpr: Expression | null = null;
    private _loggedError: boolean = false;
    private _includePure: boolean = false;
    constructor(){

    }

    getWeights(tickers: string[], segmentCount: number, filterExpr: string, includePure: boolean): number[][] | null{
        this._tickers = tickers.map(z => z.toLowerCase());
        this._filterExpr = null;
        this._includePure = includePure;
        if (filterExpr){
            this._filterExpr = ExpressionHelpers.getExpression(filterExpr);
        }
        this._loggedError = false;
        var comb = MathHelpers.combinations(segmentCount, tickers.length);
        if (comb > 1000000 && !filterExpr){
            console.error("settings would've generated " + comb + " portfolios. That is way too many.");
            return null;
        }
        return this.getWeightPermutations(0, Array(tickers.length).fill(0), segmentCount)
    }

    private getWeightPermutations(startIndex: number, incompleteWeights: number[], remainingSegments: number): number[][]{
        if (remainingSegments == 0){
            if (this._filterExpr && (!this._includePure || incompleteWeights.filter(z => z).length != 1)){
                var exprData: {[ticker: string]: number} = {};
                for (var i = 0; i < incompleteWeights.length; i++){
                    exprData[this._tickers[i]] = incompleteWeights[i];
                }
                try {
                    var passesFilter = this._filterExpr.evaluate(exprData);
                    return passesFilter ? [incompleteWeights] : [];
                } catch(e){
                    if (!this._loggedError){
                        console.error(e);
                        this._loggedError = true;
                    }
                }
            }
            return [incompleteWeights];
        }
        var output: number[][] = [];
        for (var i = startIndex; i < incompleteWeights.length; i++){
            for (var j = remainingSegments; j >= 1; j--){
                var incompleteWeightsCopy = [...incompleteWeights];
                incompleteWeightsCopy[i] += j;
                var weightss = this.getWeightPermutations(i + 1, incompleteWeightsCopy, remainingSegments - j);
                output = output.concat(weightss);
            }
        }
        return output;
    }
}