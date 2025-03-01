# Svelte Financial Web App

This project is a Svelte-based web application designed to help users manage their finances by tracking income, expenses, and savings goals. The application consists of three main pages: Overview, Financials, and Planning.

## Features

- **Overview Page**: Displays current income, savings goals, and total bank amount. Users can select between monthly and weekly views to see average income.
  
- **Financials Page**: Presents a table of financial data categorized by time periods (weeks or months). Users can click on cells or rows to view detailed payment information.

- **Planning Page**: Allows users to set savings goals and provides suggestions for cutting spending. It includes a "cut spending" action that reviews spending habits and offers insights.

## Components

- **Dropdown**: A reusable component for selecting between monthly and weekly views.
  
- **Financial Table**: Displays financial data in a tabular format, allowing for detailed views of spending.

- **Payment Details**: Shows detailed breakdowns of payments when a user interacts with the financial table.

- **Savings Plan**: Helps users input savings goals and provides strategies for achieving them, including calculations for ROTH IRA contributions.

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd svelte-webapp
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:5000` to view the application.

## Usage

- Use the Overview page to get a snapshot of your financial situation.
- Navigate to the Financials page to analyze your spending habits over time.
- Go to the Planning page to set goals and receive suggestions on how to save more effectively.

## Technologies Used

- Svelte: A modern JavaScript framework for building user interfaces.
- Rollup: A module bundler for JavaScript applications.
- D3.js: A JavaScript library for producing dynamic, interactive data visualizations in web browsers.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.