import { ref, shallowRef } from "vue";
import * as MathHelpers from "./math-helpers";
import { localSettingsService } from './localSettingsService';
import { PortfolioTicker } from "../models/models";

class PortfolioService {
    portfolioTickers = shallowRef<PortfolioTicker[]>(localSettingsService.getValue("portfolioTickers") 
        || [{baseName: "examplePortfolio", rebalanceDays: 365, holdings: [{ticker: "VFIAX", weight: 45}, {ticker: "GLD", weight: 20}, {ticker: "VBTLX", weight: 35}]}]);
    isModalOpen = ref<boolean>(false);
    workingPorfolioTicker = ref<PortfolioTicker | null>(null);
    mode = ref("");
    private _editIndex: number | null = null;

    startAddFromScatterplot(tickers: string[], weights: number[]){
        var sumWeight = MathHelpers.getSum(weights)
        var holdings: Array<{ ticker: string, weight: number}> = [];
        for (var i = 0; i < tickers.length; i++){
            if (weights[i] > 0){
                holdings.push({
                    ticker: tickers[i],
                    weight: Math.round(weights[i] / sumWeight * 1000)/10
                });
            }
        }
        this.workingPorfolioTicker.value = {
            baseName: "",
            rebalanceDays: 365,
            holdings: holdings
        }
        this.mode.value = "Create"
        this._editIndex = null;
        this.isModalOpen.value = true;
    }
    startAddBlank(){
        this.workingPorfolioTicker.value =  {
            baseName: "",
            rebalanceDays: 365,
            holdings: [{ticker: "", weight: 0}]
        }
        this.mode.value = "Create";
        this._editIndex = null;
        this.isModalOpen.value = true;
    }
    duplicate(index: number){
        this.workingPorfolioTicker.value = {
            baseName: "",
            rebalanceDays: this.portfolioTickers.value[index].rebalanceDays,
            holdings: this.portfolioTickers.value[index].holdings.map(z => ({...z}))
        };
        this.mode.value = "Create"
        this._editIndex = null;
        this.isModalOpen.value = true;
    }
    startEdit(index: number){
        this.workingPorfolioTicker.value = this.portfolioTickers.value[index];
        this.mode.value = "Edit"
        this.isModalOpen.value = true;
        this._editIndex = index;
    }
    delete(portfolio: PortfolioTicker){
        if (confirm("delete porfolio _" + portfolio.baseName + "?")){
            this.portfolioTickers.value = this.portfolioTickers.value.filter(z => z != portfolio);
            localSettingsService.setValue("portfolioTickers", this.portfolioTickers.value);
        }
    }
    save(){
        var isEdit = this.mode.value == "Edit";
        if (!this.workingPorfolioTicker.value?.baseName){
            alert("error: basename required");
            return;
        }
        if (!/^[a-zA-Z0-9]+$/.test(this.workingPorfolioTicker.value.baseName)){
            alert("error: basename can only container letters or numbers");
            return;
        }
        if (!isEdit && this.portfolioTickers.value.some(z => z.baseName.toLowerCase() == this.workingPorfolioTicker.value!.baseName.toLowerCase())){
            alert("error: basename " + this.workingPorfolioTicker.value!.baseName + " already used by different portfolio");
            return;
        }
        if (this.workingPorfolioTicker.value?.rebalanceDays <= 0){
            alert("error: rebalanceDays must be positive");
            return;
        }
        var holdings = this.workingPorfolioTicker.value.holdings.filter(z => z.weight > 0);
        if (!holdings.length){
            alert("error: portfolio has no holdings");
            return;
        }
        if (holdings.some(z => !z.ticker)){
            alert("error: missing ticker");
            return;
        }
        var invalidHolding = holdings.find(z => z.ticker.startsWith("_"))
        if (invalidHolding){
            alert("invalid ticker: " + invalidHolding.ticker + " (recursive portfolio tickers not allowed)");
            return;
        }
        var sumWeight = MathHelpers.getSum(holdings.map(z => z.weight));
        holdings.forEach(z => z.weight = Math.round(z.weight / sumWeight * 1000)/10)
        this.workingPorfolioTicker.value.holdings = holdings;
        if (!isEdit){
            this.portfolioTickers.value = [...this.portfolioTickers.value, this.workingPorfolioTicker.value];
        } else {
            this.portfolioTickers.value.splice(this._editIndex!, 1, this.workingPorfolioTicker.value);
            this.portfolioTickers.value = [...this.portfolioTickers.value];
        }
        localSettingsService.setValue("portfolioTickers", this.portfolioTickers.value);
        this.close();
    }
    close(){
        this.isModalOpen.value = false;
        this.workingPorfolioTicker.value = null;
    }
}


export var portfolioService = new PortfolioService();