<script>
  import { onMount } from 'svelte';
  import PaymentDetails from './PaymentDetails.svelte';

  export let financialData = [];
  export let timeUnit = 'monthly';
  let selectedPayment = null;
  let selectedRow = null;

  function handleCellClick(payment) {
    selectedPayment = payment;
  }

  function handleRowClick(row) {
    selectedRow = row;
  }

  onMount(() => {
    // Any initialization logic can go here
  });
</script>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  th {
    background-color: #f2f2f2;
  }
  tr:hover {
    background-color: #f1f1f1;
  }
</style>

<h2>Financial Table</h2>
<select bind:value={timeUnit}>
  <option value="weekly">Weekly</option>
  <option value="monthly">Monthly</option>
</select>

<table>
  <thead>
    <tr>
      <th>{timeUnit === 'weekly' ? 'Week' : 'Month'}</th>
      <th>Entertainment</th>
      <th>Rent</th>
      <th>Groceries</th>
      <th>Other</th>
    </tr>
  </thead>
  <tbody>
    {#each financialData as row}
      <tr on:click={() => handleRowClick(row)}>
        <td>{row.date}</td>
        <td on:click={() => handleCellClick(row.entertainment)}>{row.entertainment}</td>
        <td on:click={() => handleCellClick(row.rent)}>{row.rent}</td>
        <td on:click={() => handleCellClick(row.groceries)}>{row.groceries}</td>
        <td on:click={() => handleCellClick(row.other)}>{row.other}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#if selectedPayment}
  <PaymentDetails {selectedPayment} />
{/if}

{#if selectedRow}
  <PaymentDetails {selectedRow} />
{/if}