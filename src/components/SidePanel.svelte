<script>
  export let isOpen = false;
  export let togglePanel;
</script>

<style>
  .side-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 250px;
    height: 100%;
    background-color: var(--sponsor-primary-marble);
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }

  .side-panel.open {
    transform: translateX(0);
  }

  .side-panel ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .side-panel li {
    padding: 15px;
    border-bottom: 1px solid var(--sponsor-secondary-moonstone);
  }

  .side-panel a {
    color: var(--sponsor-secondary-onyx);
    text-decoration: none;
  }

  .hamburger {
    position: fixed;
    top: 15px;
    left: 15px;
    cursor: pointer;
    z-index: 1001;
  }

  .hamburger div {
    width: 25px;
    height: 3px;
    background-color: var(--sponsor-secondary-onyx);
    margin: 5px 0;
  }
</style>

<div class="hamburger" on:click={togglePanel}>
  <div></div>
  <div></div>
  <div></div>
</div>

<nav class="side-panel {isOpen ? 'open' : ''}">
  <ul>
    <li><a href="#overview" on:click={togglePanel}>Overview</a></li>
    <li><a href="#financials" on:click={togglePanel}>Financials</a></li>
    <li><a href="#planning" on:click={togglePanel}>Planning</a></li>
  </ul>
</nav>