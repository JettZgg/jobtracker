// When the page loads, wait for the main script to load data
document.addEventListener('DOMContentLoaded', () => {
    // Monitor changes to applicationsData, generate charts when data is loaded
    const checkDataLoaded = setInterval(() => {
        if (applicationsData && applicationsData.length > 0) {
            clearInterval(checkDataLoaded);
            generateFlowChart();
        }
    }, 100);
});

// Generate flow chart
function generateFlowChart() {
    try {
        // Remove any existing charts
        const flowChartElement = document.getElementById('flow-chart');
        flowChartElement.innerHTML = '';

        // Exit if no data
        if (!applicationsData || applicationsData.length === 0) {
            flowChartElement.innerHTML = '<p>No application data available for flow chart</p>';
            return;
        }

        // Create a simple container element
        const container = document.createElement('div');
        container.className = 'ascii-flow-container';
        container.style.fontFamily = "monospace";
        container.style.whiteSpace = 'pre';
        container.style.fontSize = '13px';
        container.style.lineHeight = '1.3';
        container.style.backgroundColor = '#1a1a1a';
        container.style.color = '#f5f5f5';
        container.style.padding = '15px';
        container.style.borderRadius = '0';
        container.style.overflow = 'auto';
        container.style.maxWidth = '100%';
        // Remove fixed height constraint to allow content to determine height
        container.style.height = 'auto';
        container.style.boxShadow = 'none';

        // Add responsive adjustments for mobile
        if (window.innerWidth <= 480) {
            container.style.padding = '10px';
            container.style.fontSize = '12px';
            container.style.lineHeight = '1.2';
        }

        // Analyze data, calculate number of applications at each stage
        const stageCounts = countApplicationsByStage();

        // Generate ASCII flow chart and format with HTML
        const asciiArt = generateAsciiFlowChart(stageCounts);
        const formattedHtml = formatAsciiWithHtml(asciiArt);
        container.innerHTML = formattedHtml;

        // Add to DOM
        flowChartElement.appendChild(container);

    } catch (error) {
        console.error('Error generating flow chart:', error);
        document.getElementById('flow-chart').innerHTML =
            '<p>Error generating flow chart. Please check console for details.</p>';
    }
}

// Count applications by stage
function countApplicationsByStage() {
    const counts = {
        'Applied': 0,
        'OA': 0,
        'First Stage': 0,
        'Second Stage': 0,
        'Third Stage': 0,
        'Assessment': 0,
        'Job Offer': 0,
        'Accepted': 0,
        'Rejected': 0,
        'Ghosted': 0
    };

    // Count total number of applications
    counts['Applied'] = applicationsData.length;

    // Count applications at each stage
    applicationsData.forEach(app => {
        if (app.history && app.history.length > 0) {
            // Only count each status once per application
            const uniqueStatuses = new Set(app.history.map(h => h.status));

            // Skip 'Applied' as we've already counted it above
            uniqueStatuses.forEach(status => {
                if (status !== 'Applied' && counts.hasOwnProperty(status)) {
                    counts[status]++;
                }
            });
        }
    });

    // Filter out stages with zero count
    Object.keys(counts).forEach(key => {
        if (counts[key] === 0) {
            delete counts[key];
        }
    });

    return counts;
}

// Generate ASCII flow chart
function generateAsciiFlowChart(stageCounts) {
    let ascii = '';

    // Debug output to console
    console.log("Stage counts for flow chart:", stageCounts);

    // Level 0: Applied
    ascii += `Applied (${stageCounts['Applied']})\n`;
    ascii += '│\n';

    // Level 1: OA
    if (stageCounts['OA'] > 0) {
        ascii += '└───> OA (' + stageCounts['OA'] + ')\n';
        ascii += '      │\n';

        // Determine if we need branches from OA
        const hasFirstStage = stageCounts['First Stage'] > 0;
        const hasRejected = stageCounts['Rejected'] > 0;

        // Add branches from OA
        if (hasFirstStage && hasRejected) {
            // Both First Stage and Rejected exist
            ascii += '      ├───> First Stage (' + stageCounts['First Stage'] + ')\n';
            ascii += '      └───> Rejected (' + stageCounts['Rejected'] + ')\n';
        } else if (hasFirstStage) {
            // Only First Stage exists
            ascii += '      └───> First Stage (' + stageCounts['First Stage'] + ')\n';
        } else if (hasRejected) {
            // Only Rejected exists
            ascii += '      └───> Rejected (' + stageCounts['Rejected'] + ')\n';
        }
    }

    return ascii;
}

// Format ASCII characters and text with different fonts
function formatAsciiWithHtml(asciiArt) {
    // Define status words to convert
    const statusWords = [
        'Applied',
        'OA',
        'First Stage',
        'Second Stage',
        'Third Stage',
        'Assessment',
        'Job Offer',
        'Accepted',
        'Rejected',
        'Ghosted'
    ];

    // Create a regex to match all status words, ensuring parentheses and numbers around them stay intact
    let formattedText = asciiArt;

    // Add HTML style for each status word
    statusWords.forEach(word => {
        // Use regex to match status words, but preserve previous ASCII characters and subsequent parentheses and numbers
        const regex = new RegExp(`(.*?)(${word})(\\s*\\(\\d+\\))`, 'g');
        formattedText = formattedText.replace(regex, (match, prefix, statusWord, suffix) => {
            return `${prefix}<span style="font-family: 'Noto Serif SC', serif;">${statusWord}</span>${suffix}`;
        });
    });

    return formattedText;
}

// Prepare Sankey diagram data
function prepareSankeyData() {
    try {
        // Return empty data structure if no application data
        if (!applicationsData || applicationsData.length === 0) {
            return { nodes: [], links: [] };
        }

        console.log('Preparing Sankey data, application count:', applicationsData.length);

        // Define process stage order
        const stageOrder = [
            'Applied',
            'OA',
            'First Stage',
            'Second Stage',
            'Third Stage',
            'Assessment',
            'Job Offer',
            'Pending (Offer Likely)',
            'Accepted',
            'Declined',
            'Rejected',
            'Ghosted'
        ];

        // Collect nodes (different statuses)
        const nodesMap = new Map();
        const linksMap = new Map(); // Use Map to store links to avoid duplicates

        // Add all possible stage nodes
        stageOrder.forEach(stage => {
            if (!nodesMap.has(stage)) {
                nodesMap.set(stage, { name: stage, value: 0 });
            }
        });

        // Set Applied node value to total application count
        nodesMap.get('Applied').value = applicationsData.length;

        // Manually check each application's history, directly calculate applications passing through each status
        applicationsData.forEach((app, index) => {
            if (!app.history || app.history.length === 0) return;

            // Record this application's status history
            const statusHistory = app.history.map(h => h.status);

            // Calculate application count for each status (without duplicates)
            const uniqueStatuses = [...new Set(statusHistory)];

            uniqueStatuses.forEach(status => {
                if (nodesMap.has(status)) {
                    nodesMap.get(status).value++;
                }
            });

            // Create status transition links
            for (let i = 0; i < statusHistory.length - 1; i++) {
                const source = statusHistory[i];
                const target = statusHistory[i + 1];

                if (!source || !target) continue;

                // Update link value
                const linkKey = `${source}->${target}`;
                if (linksMap.has(linkKey)) {
                    linksMap.get(linkKey).value++;
                } else {
                    linksMap.set(linkKey, {
                        source,
                        target,
                        value: 1
                    });
                }
            }
        });

        // Filter valid nodes (nodes with links and count > 0)
        const linkSources = new Set([...linksMap.values()].map(link => link.source));
        const linkTargets = new Set([...linksMap.values()].map(link => link.target));
        const activeNodeNames = new Set([...linkSources, ...linkTargets]);

        // Create sorted node array - filter out nodes with zero count
        const nodes = Array.from(nodesMap.entries())
            .filter(([name, node]) =>
                (activeNodeNames.has(name) || name === 'Applied') && node.value > 0)
            .sort((a, b) => {
                const indexA = stageOrder.indexOf(a[0]);
                const indexB = stageOrder.indexOf(b[0]);
                return indexA - indexB;
            })
            .map(([name, node]) => ({ name: node.name, value: node.value }));

        // Filter valid links (links where source and target both exist)
        const validNodeNames = new Set(nodes.map(n => n.name));
        const links = Array.from(linksMap.values())
            .filter(link =>
                validNodeNames.has(link.source) &&
                validNodeNames.has(link.target)
            );

        console.log("Sankey data preparation complete:", {
            nodes,
            links,
            nodeCount: nodes.length,
            linkCount: links.length
        });

        return { nodes, links };
    } catch (error) {
        console.error("Error preparing Sankey data:", error);
        return { nodes: [], links: [] };
    }
} 