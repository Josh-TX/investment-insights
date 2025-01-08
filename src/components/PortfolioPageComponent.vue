<script setup lang="ts">
import { PortfolioTicker } from "../models/models";
import { portfolioService } from "../services/portfolioService";

function open(){
    portfolioService.startAddBlank();
}

function copy(portfolio: PortfolioTicker){
    var str = portfolio.holdings.map(z => z.ticker).join(" ");
    navigator.clipboard.writeText(str);
}
</script>

<template>
<div style="padding: 12px;">
    <h3 style="line-height: 12px;;">Portfolio Tickers</h3>
    <small>Combine tickers into a portfolio, and this itself becomes a ticker you can use. All portfolio tickers are prefixed with an underscore</small>
    <template v-for="(portfolio, i) in portfolioService.portfolioTickers.value">
        <div style="width: 100%; background: #333; padding: 8px 12px;  border-radius: 4px; box-shadow: 1px 1px 3px #00000055; position: relative; margin-bottom: 12px;">
            <h3 style="margin-bottom: 4px;">_{{portfolio.baseName}} &nbsp; <small style="font-weight: 400;">rebalance every {{ portfolio.rebalanceDays }} days</small></h3>
            <div style="display: flex; justify-content: left;">
                <div style="display: grid; grid-template-rows: auto auto; grid-auto-flow: column; gap: 0 12px; ">
                    <template v-for="(holding) in portfolio.holdings">
                        <div> {{ holding.ticker }}</div>
                        <div>{{ holding.weight }}%</div>
                    </template>
                    <div style="grid-row-start: span 2;">
                        <button style="padding: 4px 12px; font-size: 0.75em;" @click="copy(portfolio)">📄 copy tickers</button>
                    </div>
                </div>
            </div>
            <div style="position: absolute; right: 0; top: 0;">
                <button style="padding: 4px 12px; margin: 8px;" @click="portfolioService.startEdit(i)">Edit</button>
                <button style="padding: 4px 12px; margin: 8px;" @click="portfolioService.duplicate(i)">Duplicate</button>
                <button style="padding: 4px 12px; margin: 8px;" @click="portfolioService.delete(portfolio)">Delete</button>
            </div>
        </div>
    </template>
    <button @click="open()">New Portfolio Ticker</button>
</div>



</template>

<style scoped>
</style>
