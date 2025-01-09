<script setup lang="ts">

import { ScatterplotAxisInputs } from "../models/models";

const inputs = defineModel<ScatterplotAxisInputs>("inputs", {required: true})



</script>

<template>
    <div style="display: flex; gap: 16px;">
        <div>
            <label>Type</label>
            <br>
            <select v-model="inputs.mode">
                <option value="return">Return</option>
                <option value="logReturnSD">Log Return SD</option>
                <option value="logLossRMS">Log Loss RMS</option>
                <option value="maxDrawdown">Max Drawdown</option>
            </select>
        </div>
        <div v-if="inputs.mode == 'logReturnSD' || inputs.mode == 'logLossRMS'">
            <label>Return Period</label>
            <br>
            <div class="input-wrapper">
                <input v-model.number="inputs.returnDays" type="number">
                <span class="input-wrapper-text">days</span>
            </div>
        </div>
        <div v-if="inputs.mode == 'logReturnSD' || inputs.mode == 'logLossRMS'">
            <label>Smooth</label>
            <br>
            <div class="input-wrapper">
                <input v-model.number="inputs.smoothDays" type="number">
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
