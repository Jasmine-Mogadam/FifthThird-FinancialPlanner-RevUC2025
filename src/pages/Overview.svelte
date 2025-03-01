<script>
  import { onMount } from 'svelte';
  import Dropdown from '../components/Dropdown.svelte';

  let currentIncome = 5000; // Example current income
  let savingsGoal = 20000; // Example savings goal
  let totalBankAmount = 15000; // Example total amount in bank
  let timeUnit = 'Monthly'; // Default time unit

  const timeUnits = ['Monthly', 'Weekly'];

  let averageIncome = 0;

  onMount(() => {
    // Calculate average income based on the current income and time unit
    averageIncome = timeUnit === 'Monthly' ? currentIncome : currentIncome / 4; // Simplified for example
  });

  function handleTimeUnitChange(event) {
    timeUnit = event.detail;
    averageIncome = timeUnit === 'Monthly' ? currentIncome : currentIncome / 4; // Update average income
  }
</script>

<style>
  .overview {
    padding: 20px;
  }
  .summary {
    margin-bottom: 20px;
  }
</style>

<div class="overview">
  <h1>Overview</h1>
  <Dropdown {timeUnits} bind:value={timeUnit} on:change={handleTimeUnitChange} />

  <div class="summary">
    <p>Current Income: ${currentIncome}</p>
    <p>Savings Goal: ${savingsGoal}</p>
    <p>Total Amount in Bank: ${totalBankAmount}</p>
    <p>Average Income per {timeUnit}: ${averageIncome}</p>
  </div>
</div>