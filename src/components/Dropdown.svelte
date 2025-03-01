<script>
  export let options = [];
  export let selected = '';

  function handleChange(event) {
    selected = event.target.value;
    const changeEvent = new CustomEvent('change', {
      detail: selected
    });
    dispatchEvent(changeEvent);
  }
</script>

<select on:change={handleChange} bind:value={selected}>
  {#each options as option}
    <option value={option}>{option}</option>
  {/each}
</select>

<style>
  select {
    padding: 0.5em;
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>