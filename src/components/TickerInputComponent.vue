<script setup lang="ts">

import { tickerInputs } from "../services/tickerInputService"


</script>

<template>
    <div style="display: flex; gap: 16px; justify-content: space-between;">
        <div style="flex: 1; padding-right: 8px;" >
            <label>Tickers (use $ for money market)</label>
            <br>
            <input v-model="tickerInputs.tickers" style="width: 100%">
        </div>
        <small class="text-muted"><a href="https://github.com/Josh-TX/investment-insights">github</a> | Created by Josh TX </small>
    </div>
</template>

<style scoped></style>
