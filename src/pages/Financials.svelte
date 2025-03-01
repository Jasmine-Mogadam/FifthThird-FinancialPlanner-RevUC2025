<script>
  import FinancialTable from '../components/FinancialTable.svelte';
  import Dropdown from '../components/Dropdown.svelte';
  import { onMount } from 'svelte';

  let timeUnit = 'monthly'; // default time unit
  let financialData = []; // to hold financial data

  // Function to fetch financial data based on the selected time unit
  const fetchFinancialData = () => {
    // Placeholder for fetching data logic
    // This could be an API call or local data fetching
    financialData = [
      { date: 'January 2023', entertainment: 200, rent: 1200, groceries: 300 },
      { date: 'February 2023', entertainment: 150, rent: 1200, groceries: 250 },
      // Add more data as needed
    ];
  };

  onMount(() => {
    fetchFinancialData();
  });

  const handleTimeUnitChange = (event) => {
    timeUnit = event.detail;
    fetchFinancialData(); // Re-fetch data based on the new time unit
  };
</script>

<main>
  <h1>Financials</h1>
  <Dropdown {timeUnit} on:change={handleTimeUnitChange} />

  <FinancialTable {financialData} {timeUnit} />
</main>

<style>
  main {
    padding: 1rem;
  }
</style>