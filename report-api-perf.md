# Report API Performance Metrics

## GET /api/v1/reports

- Response Time: 0.002329s (first test)
- Response Time: 0.002139s (after generation)
- Response Time: 0.000837s (single test)
- Response Time: 0.000883s (final test)

## POST /api/v1/reports (Report Generation)

- Total Time: 2.085968s

## Individual Report Generation Times

Based on the response from the GET endpoint:

- accounts.csv: 0.86s
- yearly.csv: 0.50s
- fs.csv: 0.72s

## Summary

The report generation API POST endpoint takes approximately 2 seconds to complete the report generation process. This includes processing multiple CSV files from the tmp directory and generating three different reports.

The GET endpoint is very fast, responding in less than 3ms, as it only returns the status of each report including their generation times.

The individual report generation times show that the accounts report takes the longest to generate (0.86s), followed by the financial statement report (0.72s), and the yearly report is the fastest (0.50s).
