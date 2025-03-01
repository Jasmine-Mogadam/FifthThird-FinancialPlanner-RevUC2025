<script>
  import { onMount } from 'svelte';
  import SavingsPlan from '../components/SavingsPlan.svelte';
  
  let goal = 4000; // Default goal for ROTH IRA
  let currentSavings = 0; // Current savings amount
  let cutSpendingReview = '';

  function calculateSavingsPlan() {
    // Logic to calculate savings plan based on current savings and goal
    const monthlyContribution = (goal - currentSavings) / 12;
    return monthlyContribution > 0 ? monthlyContribution : 0;
  }

  function reviewSpending() {
    // Logic to review spending habits
    cutSpendingReview = `You spent $100 on groceries this month, that's 30% less than the average $300, and 3% less than last month.`;
  }

  onMount(() => {
    // Any initialization logic can go here
  });
</script>

<style>
  .planning-container {
    padding: 20px;
  }
  .review {
    margin-top: 20px;
    font-weight: bold;
  }
</style>

<div class="planning-container">
  <h1>Financial Planning</h1>
  
  <SavingsPlan {goal} bind:currentSavings />

  <button on:click={reviewSpending}>Cut Spending</button>
  
  {#if cutSpendingReview}
    <div class="review">{cutSpendingReview}</div>
  {/if}

  <h2>Suggested Monthly Contribution: ${calculateSavingsPlan()}</h2>
</div>