<script>
  export let paymentDetails = [];
  export let totalAmount = 0;

  function formatDate(date) {
    return new Date(date).toLocaleDateString();
  }
</script>

<style>
  .payment-details {
    border: 1px solid #ccc;
    padding: 1rem;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  .payment-details h2 {
    margin: 0 0 1rem 0;
  }
  .payment-details table {
    width: 100%;
    border-collapse: collapse;
  }
  .payment-details th, .payment-details td {
    border: 1px solid #ddd;
    padding: 0.5rem;
    text-align: left;
  }
  .payment-details th {
    background-color: #f2f2f2;
  }
</style>

<div class="payment-details">
  <h2>Payment Details</h2>
  <p>Total Amount: ${totalAmount}</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Amount</th>
        <th>Payee</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody>
      {#each paymentDetails as payment}
        <tr>
          <td>{formatDate(payment.date)}</td>
          <td>${payment.amount}</td>
          <td>{payment.payee}</td>
          <td>{payment.type}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>