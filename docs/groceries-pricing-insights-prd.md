# Product Requirements Document: Groceries Pricing Insights

## 1. Introduction

This document details the requirements for the Groceries Pricing Insights feature within the Recipe & Grocery Planner App. This feature focuses on providing users with historical price data for grocery items from various Dutch supermarkets, allowing them to track trends and understand price fluctuations over time.

## 2. Goals

- Enable users to visualize historical price changes for specific grocery items.
- Help users identify periods of significant price increase or decrease for common groceries.
- Provide context for current prices shown in the shopping list feature.
- Increase user awareness of grocery price inflation in the Netherlands.
- Support users in making informed purchasing decisions based on historical price context.

## 3. User Stories

- **As a user concerned about inflation, I want to** search for a specific grocery item (e.g., "Milk", "Brown Bread", "Specific brand of coffee") **so that** I can see its price history.
- **As a user, I want to** view a chart showing the price trend of an item over different time periods (e.g., last 3 months, last 6 months, last year) **so that** I can understand its price volatility.
- **As a user, I want to** see the historical prices from different supported Dutch supermarkets on the same chart **so that** I can compare their pricing history.
- **As a user, I want to** easily access the price history for an item directly from my shopping list **so that** I can get context on its current price.
- **As a user, I want to** see an indicator if the current price of an item is significantly higher or lower than its recent average **so that** I can quickly identify potential deals or price hikes.

## 4. Features & Requirements

### 4.1 Price Data Collection & Storage

- **Data Source:** Utilize the same underlying price data source(s) established for the core shopping list pricing feature (see `docs/recipes-prd.md`). This likely involves regular fetching (e.g., daily) from supermarket APIs or reliable scraping methods.
- **Historical Storage:** Store fetched prices over time, associated with specific products/SKUs and supermarkets. Define data retention policies (e.g., store daily prices for the last 1-2 years).
- **Product Matching & Standardization:** Implement robust logic to match equivalent products across different supermarkets and track their price history consistently, even if SKU codes change. Standardized product identifiers are crucial.

### 4.2 Price Trend Visualization

- **Item Search:** Provide a dedicated section or search bar within the app for users to look up grocery items.
- **Chart Display:**
  - For a selected item, display a line chart visualizing its price over time.
  - Allow users to select the time range (e.g., 3 months, 6 months, 1 year, Max available).
  - Allow users to select which supermarket(s) prices to display on the chart. Default could be the user's preferred stores or the average price.
- **Data Granularity:** Determine the granularity of the chart (e.g., daily, weekly average) based on data availability and performance considerations. Daily might be too noisy; weekly or monthly averages might be more insightful for long-term trends.
- **Comparison:** Enable easy comparison of price trends for the same item across different supported supermarkets.

### 4.3 Integration with Shopping List

- **Contextual Link:** From an item listed in the generated shopping list, provide a clear link or button to view its detailed price history chart.
- **Price Context Indicator (Optional):** On the shopping list, potentially display a subtle indicator next to the current price (e.g., an up/down arrow, color coding) signifying if the current price is significantly above or below its recent historical average (e.g., last 30 days).

### 4.4 Data Management

- **Supermarket Coverage:** Clearly define and communicate which Dutch supermarkets are included in the historical price tracking (e.g., Albert Heijn, Jumbo, Plus, Lidl initially).
- **Data Updates:** Ensure the historical data backend is updated regularly in sync with current price fetching.

## 5. Non-Functional Requirements

- **Performance:** Price history queries and chart generation should be performant, even with significant historical data. Consider aggregation or indexing strategies.
- **Accuracy:** Strive for high accuracy in historical price data, acknowledging potential minor discrepancies from the source.
- **Scalability:** The system must handle the storage and retrieval of a large volume of price points over time for numerous products.
- **Usability:** Charts and data visualizations must be clear, easy to understand, and interactive.
- **Data Privacy:** Ensure compliance with privacy regulations; historical data is generally less sensitive than personal data but should still be handled appropriately.

### 5.1 Acceptance Criteria

- **Item Search:**
  - Given a user searches for a known grocery item, the system returns relevant matches.
- **Price Chart Display:**
  - Given a user selects an item, a price trend chart is displayed.
  - The chart accurately reflects the stored historical price data for the selected item and time range.
  - The user can successfully select/deselect supermarkets to compare their price history on the chart.
  - The user can successfully change the time range displayed on the chart.
- **Shopping List Integration:**
  - Given an item on the shopping list, the user can successfully navigate to its price history view.
- **Data Consistency:**
  - Historical prices shown are consistent with the data collection process.

### 5.2 Constraints

- **Data Source Reliability:** The entire feature relies heavily on the continuous availability and accuracy of price data from external supermarket sources. Changes in APIs or website structures can break data collection.
- **Historical Data Availability:** There might be gaps in historical data, especially initially or if data sources become temporarily unavailable. The system should handle and potentially visualize these gaps gracefully.
- **Product Matching Complexity:** Accurately matching the _same_ product across different stores and over time (despite packaging changes, temporary promotions, SKU updates) is a significant technical challenge. Heuristics and potentially manual curation might be needed.
- **Storage Costs:** Storing granular price data over long periods can incur significant storage costs. Define retention periods and aggregation strategies carefully.
- **Initial Scope:** v1 focuses on visualizing historical trends for searched items and linking from the shopping list. More advanced analytics (e.g., category trends, inflation indexes) are out of scope for v1.
- **Supermarket Scope:** Limited to selected Dutch supermarkets for v1.

## 6. Design & UX Considerations

- Use clear and standard chart components (e.g., line charts).
- Ensure charts are responsive and legible on mobile devices.
- Provide clear labels for axes, legends, and data points.
- Make filtering by supermarket and time range intuitive.
- Consider accessibility for users with visual impairments (e.g., color contrast, data tables as alternatives).
- Smooth integration with the existing shopping list UI.

## 7. Future Considerations / Out of Scope (v1)

- Calculating and displaying personalized inflation rates based on user's typical purchases.
- Analyzing price trends for broader categories (e.g., "Dairy", "Vegetables").
- Predicting future price movements (highly complex and speculative).
- Comparing prices against national average statistics.
- Setting price alerts based on historical lows/highs.
- Exporting price history data.
- Adding annotations to charts (e.g., marking specific events or promotions).
