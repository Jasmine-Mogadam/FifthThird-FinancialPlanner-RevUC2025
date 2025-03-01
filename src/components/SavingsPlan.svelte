<script>
    import { onMount } from 'svelte';
    let savingsGoal = 4000; // Default ROTH IRA goal
    let monthlySavings = 0;
    let totalSavings = 0;
    let spendingCutSuggestions = [];

    function calculateSavingsPlan() {
        monthlySavings = Math.ceil(savingsGoal / 12); // Monthly savings for ROTH IRA
        totalSavings = 0; // Reset total savings
        spendingCutSuggestions = []; // Reset suggestions

        // Example spending cut suggestions based on average spending
        spendingCutSuggestions.push("Consider reducing entertainment spending by $50.");
        spendingCutSuggestions.push("Try to limit dining out to once a week.");
        spendingCutSuggestions.push("Evaluate subscriptions and cancel unused ones.");
    }

    onMount(() => {
        calculateSavingsPlan();
    });
</script>

<style>
    .savings-plan {
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f9f9f9;
    }
    h2 {
        margin-bottom: 10px;
    }
    .suggestions {
        margin-top: 20px;
        list-style-type: none;
        padding: 0;
    }
    .suggestions li {
        background: #e7f3fe;
        margin: 5px 0;
        padding: 10px;
        border-radius: 3px;
    }
</style>

<div class="savings-plan">
    <h2>Savings Plan</h2>
    <p>Your ROTH IRA goal: $<strong>{savingsGoal}</strong></p>
    <p>Monthly savings needed: $<strong>{monthlySavings}</strong></p>
    
    <h3>Spending Cut Suggestions</h3>
    <ul class="suggestions">
        {#each spendingCutSuggestions as suggestion}
            <li>{suggestion}</li>
        {/each}
    </ul>
</div>