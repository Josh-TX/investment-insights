<script setup lang="ts">
import { portfolioService } from '../services/portfolioService'


function close(){
    portfolioService.isModalOpen.value = false;
}

function addRow(){
    portfolioService.workingPorfolioTicker.value?.holdings.push({ticker: "", weight: 0})
}

function removeRow(holding: {ticker: string, weight: number}){
    portfolioService.workingPorfolioTicker.value!.holdings =  portfolioService.workingPorfolioTicker.value!.holdings.filter(z => z != holding);
}

var isModalOpen = portfolioService.isModalOpen;

</script>

<template>
    <div class="modal-overlay" v-if="isModalOpen">
        <div class="modal-container">
            <div class="modal" v-if="portfolioService.workingPorfolioTicker.value">
                <h2 style="margin: 0 0 4px 0;">{{ portfolioService.mode.value }} Portfolio Ticker</h2>
                <div style="display: flex;">
                    <div style="flex: 1">
                        <label class="bigger-font">base name</label>
                        <br>
                        <input v-model="portfolioService.workingPorfolioTicker.value.baseName">
                    </div>
                    <div style="flex: 1">
                        <label class="bigger-font">rebalance days</label>
                        <br>
                        <input v-model.number="portfolioService.workingPorfolioTicker.value.rebalanceDays" type="number">
                    </div>
                </div>
                <div class="invisible" :class="{visible: portfolioService.workingPorfolioTicker.value.baseName }">Porfolio Ticker will be <span>_{{ portfolioService.workingPorfolioTicker.value.baseName }}</span></div>
                <div style="display: grid; grid-template-columns: auto auto auto; justify-content: center; gap: 4px 16px; margin-top: 12px;">
                    <div class="bigger-font" style="grid-column: 1 / span 3;">holdings</div>
                    <div>ticker</div>
                    <div>percent</div>
                    <div></div>
                    <template v-for="(holding) in portfolioService.workingPorfolioTicker.value.holdings">
                        <div><input v-model="holding.ticker"></div>
                        <div><input v-model.number="holding.weight" type="number"></div>
                        <div class="clickable-text" @click="removeRow(holding)">&times;</div>
                    </template>
                    <div></div>
                    <div style="text-align: end;" class="clickable-text" @click="addRow">&plus; add row</div>
                </div>
                <div class="h1" style="margin: 16px 0;"></div>
                <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                    <button @click="close">Cancel</button>
                    <button @click="portfolioService.save()" v-if="portfolioService.mode.value == 'Create'">Create <span v-if="portfolioService.workingPorfolioTicker.value.baseName">_{{ portfolioService.workingPorfolioTicker.value.baseName }}</span></button>
                    <button @click="portfolioService.save()" v-if="portfolioService.mode.value == 'Edit'">Save Changes</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.modal-container {
    max-width: 800px;
    margin: 15vh auto 0 auto;
    padding: 0 12px;
    display: flex;
    justify-content: center;;
}
.clickable-text{
    cursor: pointer;
}
.clickable-text:hover {
    text-decoration: underline !important;
}

.bigger-font{
    font-size: 1.2em; 
    font-weight: 600;
}

.modal {
    background: #333;
    border: 1px solid #666;
    padding: 8px 16px 16px 16px;
    box-shadow: 4px 4px 16px 2px rgba(0, 0, 0, 0.5);
}

.modal-overlay {
    position: fixed;
    z-index: 100;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.4);
    animation: fadeIn 0.4s;
}
</style>