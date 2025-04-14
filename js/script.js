// Global variables
let applicationsData = [];
let statusCounts = {};
let uniqueStatuses = [];

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    // Add event listeners
    document.getElementById('search').addEventListener('input', filterApplications);
    document.getElementById('status-filter').addEventListener('change', filterApplications);
});

// Fetch data
function fetchData() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded data:', data);
            if (!data.applications || !Array.isArray(data.applications)) {
                throw new Error('Incorrect data format: applications array does not exist or is not an array');
            }

            applicationsData = data.applications || [];
            console.log('Number of application records:', applicationsData.length);
            console.log('All applications:', applicationsData);

            // Check if there are any records from 2025
            const futureRecords = applicationsData.filter(app =>
                new Date(app.lastUpdate).getFullYear() >= 2024
            );
            console.log('Future records:', futureRecords);

            try {
                processData();
                renderApplications();
                updateStats();
                populateStatusFilter();
            } catch (error) {
                console.error('Error processing or rendering data:', error);
            }
        })
        .catch(error => {
            console.error('Error fetching or processing data:', error);
            document.getElementById('applications-list').innerHTML =
                '<tr><td colspan="5">Error loading data. Please ensure data.json file exists and is correctly formatted. See console for details.</td></tr>';
        });
}

// Process data, extract unique statuses and calculate statistics
function processData() {
    // Clear current status
    statusCounts = {};
    uniqueStatuses = [];

    // Collect all unique statuses
    applicationsData.forEach(app => {
        if (!statusCounts[app.status]) {
            statusCounts[app.status] = 0;
        }
        statusCounts[app.status]++;

        app.history.forEach(h => {
            if (!uniqueStatuses.includes(h.status)) {
                uniqueStatuses.push(h.status);
            }
        });
    });

    // Sort statuses (optional, based on your needs)
    uniqueStatuses.sort();
}

// Update statistics
function updateStats() {
    document.getElementById('total-applications').textContent = applicationsData.length;

    // Calculate active applications (non-final status)
    const finalStatuses = ['Accepted', 'Rejected', 'Ghosted', 'Declined'];
    const activeCount = applicationsData.filter(app => !finalStatuses.includes(app.status)).length;
    document.getElementById('active-applications').textContent = activeCount;

    // Calculate completed applications (final status)
    const completedCount = applicationsData.length - activeCount;
    document.getElementById('completed-applications').textContent = completedCount;
}

// Populate status filter dropdown
function populateStatusFilter() {
    const statusFilter = document.getElementById('status-filter');

    // Clear existing options (keep "All Statuses" option)
    while (statusFilter.options.length > 1) {
        statusFilter.remove(1);
    }

    // Add each unique status as an option
    uniqueStatuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });
}

// Render applications list
function renderApplications(filteredApps = null) {
    let applicationsToRender = filteredApps || applicationsData;

    // Sort by last update date (newest to oldest)
    applicationsToRender = [...applicationsToRender].sort((a, b) => {
        const dateA = new Date(a.lastUpdate || '1900-01-01');
        const dateB = new Date(b.lastUpdate || '1900-01-01');
        return dateB - dateA; // Descending order (new→old)
    });

    console.log('Applications ready to render:', applicationsToRender.length);

    const tbody = document.getElementById('applications-list');

    // Clear current list
    tbody.innerHTML = '';

    if (applicationsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No application records found</td></tr>';
        return;
    }

    // Add a row for each application
    applicationsToRender.forEach((app, index) => {
        console.log(`Rendering application ${index + 1}:`, app.company, app.position, app.status);

        const tr = document.createElement('tr');

        // Company column
        const tdCompany = document.createElement('td');
        tdCompany.textContent = app.company;
        tr.appendChild(tdCompany);

        // Position column
        const tdPosition = document.createElement('td');
        tdPosition.textContent = app.position;
        tr.appendChild(tdPosition);

        // Status column
        const tdStatus = document.createElement('td');
        tdStatus.textContent = app.status;
        tdStatus.style.color = '#f5f5f5';
        tr.appendChild(tdStatus);

        // Last update column
        const tdLastUpdate = document.createElement('td');
        tdLastUpdate.textContent = app.lastUpdate || 'Unknown';
        tr.appendChild(tdLastUpdate);

        // History column
        const tdHistory = document.createElement('td');
        const historyBtn = document.createElement('button');
        historyBtn.textContent = 'View History';
        historyBtn.className = 'history-btn';
        historyBtn.onclick = () => showHistory(app);
        tdHistory.appendChild(historyBtn);
        tr.appendChild(tdHistory);

        tbody.appendChild(tr);
    });
}

// Filter applications
function filterApplications() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;

    const filtered = applicationsData.filter(app => {
        const matchesSearch =
            app.company.toLowerCase().includes(searchTerm) ||
            app.position.toLowerCase().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderApplications(filtered);
}

// Show history
function showHistory(application) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => document.body.removeChild(modal);

    modalContent.appendChild(closeBtn);

    // Title
    const title = document.createElement('h2');
    title.textContent = `${application.company} - ${application.position}`;
    modalContent.appendChild(title);

    // History list
    const historyList = document.createElement('ul');
    historyList.style.listStyleType = 'none';
    historyList.style.padding = '1rem 0';
    historyList.style.margin = '0';

    // Show history in reverse order (newest at the top)
    const sortedHistory = [...application.history].reverse();

    sortedHistory.forEach(entry => {
        const item = document.createElement('li');
        item.style.padding = '0.5rem 0';
        item.style.borderBottom = '1px solid #333';

        const status = document.createElement('strong');
        status.textContent = entry.status;

        // Add color based on status
        status.style.color = '#f5f5f5';

        const date = document.createTextNode(` - ${entry.date || 'Unknown date'}`);

        item.appendChild(status);
        item.appendChild(date);
        historyList.appendChild(item);
    });

    modalContent.appendChild(historyList);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Display modal
    modal.style.display = 'block';

    // Close when clicking outside the modal
    window.onclick = (event) => {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// Format date
function formatDate(dateString) {
    try {
        console.log('Formatting date:', dateString);

        // Check date format
        if (!dateString || typeof dateString !== 'string') {
            console.error('Invalid date string:', dateString);
            return 'Invalid date';
        }

        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.error('Cannot parse date:', dateString);
            return dateString;
        }

        // Only return date part (YYYY-MM-DD)
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return dateString; // Return original string on error
    }
} 