<script setup lang="ts">

import { LineChartDataInputs } from "../models/models";

const inputs = defineModel<LineChartDataInputs>("inputs", {required: true})



</script>

<template>
    <div style="display: flex; gap: 16px;">
        <div>
            <label>Line Type</label>
            <br>
            <select v-model="inputs.mode">
                <option value="none">(none)</option>
                <option value="price">Price</option>
                <option value="returns">Returns</option>
                <option value="logReturns">Log Returns</option>
                <option value="maxDrawdown">Max Drawdown</option>
                <option value="logLosses">Log Losses</option>
            </select>
        </div>
        <div v-if="inputs.mode == 'returns' || inputs.mode == 'logReturns' || inputs.mode == 'logLosses'">
            <label>Return Period</label>
            <br>
            <div class="input-wrapper">
                <input v-model.number="inputs.returnDays" type="number">                            
                <span class="input-wrapper-text">days</span>
            </div>
        </div>
        <div v-if="inputs.mode == 'returns' || inputs.mode == 'logReturns' || inputs.mode == 'logLosses'">
            <label>Smooth</label>
            <br>
            <div class="input-wrapper">
                <input v-model.number="inputs.smoothDays" type="number">                           
                <span class="input-wrapper-text">days</span>
            </div>
        </div>
        <div style="padding-top: 24px;" v-if="inputs.mode == 'price' || inputs.mode == 'maxDrawdown'"> 
            <input type="checkbox" v-model.boolean="inputs.equalPrice">
            <label>Equalize Starting Price</label>
        </div>
        <div v-if="inputs.mode == 'returns' || inputs.mode == 'logReturns' || inputs.mode == 'logLosses'">
            <label>Return Extrapolation</label>
            <br>
            <div class="input-wrapper">
                <input v-model.number="inputs.extrapolateDays" type="number">                      
                <span class="input-wrapper-text">days</span>
            </div>
        </div>
        <div v-if="inputs.mode == 'maxDrawdown'">
            <label>peak & trough maintained</label>
            <br>
            <div class="input-wrapper">
                <input v-model.number="inputs.drawdownDays" type="number" style="width: 100%;">                     
                <span class="input-wrapper-text">days</span>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
