<script>
  import Overview from './pages/Overview.svelte';
  import Financials from './pages/Financials.svelte';
  import Planning from './pages/Planning.svelte';
  import { onMount } from 'svelte';

  let currentPage = 'overview';

  function navigate(page) {
    currentPage = page;
  }

  onMount(() => {
    // Initialize any necessary data or state here
  });
</script>

<style>
  nav {
    display: flex;
    justify-content: space-around;
    background-color: #f8f9fa;
    padding: 1rem;
  }

  nav button {
    cursor: pointer;
    padding: 0.5rem 1rem;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
  }

  nav button:hover {
    background-color: #0056b3;
  }
</style>

<nav>
  <button on:click={() => navigate('overview')}>Overview</button>
  <button on:click={() => navigate('financials')}>Financials</button>
  <button on:click={() => navigate('planning')}>Planning</button>
</nav>

{#if currentPage === 'overview'}
  <Overview />
{:else if currentPage === 'financials'}
  <Financials />
{:else if currentPage === 'planning'}
  <Planning />
{/if}