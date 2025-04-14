# Job Application Tracker

A minimal, elegant job application tracking system with visualization tools to help you manage your job search process.

## Features

- **Application Tracking**: Keep track of all your job applications in one place
- **Flow Chart Visualization**: See your applications' progress through the recruitment pipeline
- **Filtering**: Easily filter applications by status or search for specific companies/positions
- **Status History**: Track each application's journey through different stages
- **Statistics**: View summary statistics of your job search progress
- **CLI Tool**: Manage your applications from the command line

## Getting Started

### Prerequisites

- A modern web browser
- Node.js (for running the application and using the CLI tool)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/jettzgg/jobtracker.git
   cd jobtracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Open the index.html file in your browser, or use a local server:
   ```
   npx serve
   ```

## Usage

### Managing Applications with CLI

The application includes a command-line interface (CLI) tool for managing your job applications without having to manually edit the data.json file.

#### Available Commands

1. **List all applications**:
   ```
   node cli.js list
   ```

2. **Add a new application**:
   ```
   node cli.js add
   ```
   You'll be prompted to enter company name and position. The application will be automatically set to "Applied" status with today's date.

3. **Update application status**:
   ```
   node cli.js update
   ```
   This will show a list of your applications and allow you to select one to update its status.

### Manual Data Editing

Alternatively, you can directly edit the `data.json` file to add or modify your job applications. The format is:

```json
{
  "applications": [
    {
      "company": "Company Name",
      "position": "Position Title",
      "status": "Current Status",
      "lastUpdate": "YYYY-MM-DD",
      "history": [
        {
          "status": "Applied",
          "date": "YYYY-MM-DD"
        },
        {
          "status": "OA",
          "date": "YYYY-MM-DD"
        }
      ]
    }
  ]
}
```

### Application Statuses

The system supports tracking these standard recruitment stages:

- Applied
- OA (Online Assessment)
- First Stage
- Second Stage
- Third Stage
- Assessment
- Job Offer
- Accepted
- Rejected
- Ghosted
- Declined

### Visualizations

- **Flow Chart**: Displays the progression of your applications through different stages
- **Application List**: Shows all applications with current status and history

## Customization

### Adding New Status Types

To add new statuses:

1. Update the `countApplicationsByStage` function in `js/chart.js`
2. Add the new status to the `stageOrder` array in `prepareSankeyData` function
3. Add the new status to the `statusWords` array in `formatAsciiWithHtml` function
4. Add the new status to the `commonStatuses` array in `cli.js`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Uses [D3.js](https://d3js.org/) for visualization
- Uses [D3-Sankey](https://github.com/d3/d3-sankey) for flow diagrams 