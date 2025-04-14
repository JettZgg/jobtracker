#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

// If uuid library is not available, use this simple function to generate ID
function generateId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ensure data file exists
function ensureDataFileExists() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ applications: [] }, null, 2));
    }
}

// Read data
function readData() {
    ensureDataFileExists();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate current date (date part only, no time)
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Add new application
function addApplication() {
    rl.question('Company name: ', (company) => {
        rl.question('Position title: ', (position) => {
            const now = getCurrentDate();
            const data = readData();

            const newApplication = {
                id: uuidv4 ? uuidv4() : generateId(),
                company,
                position,
                status: 'Applied',
                lastUpdate: now,
                history: [
                    {
                        status: 'Applied',
                        date: now
                    }
                ]
            };

            data.applications.push(newApplication);
            writeData(data);
            console.log(`Application added, ID: ${newApplication.id}`);
            rl.close();
        });
    });
}

// Display application list and let user choose
function updateApplication() {
    const data = readData();

    if (data.applications.length === 0) {
        console.log('No application records');
        rl.close();
        return;
    }

    console.log('\nPlease select an application to update:');
    console.log('-----------------------------------------------');

    // Display application list with numbers
    data.applications.forEach((app, index) => {
        console.log(`[${index + 1}] ${app.company} - ${app.position} (${app.status})`);
    });

    console.log('-----------------------------------------------');

    rl.question('Please enter a number: ', (indexStr) => {
        const index = parseInt(indexStr) - 1;

        if (isNaN(index) || index < 0 || index >= data.applications.length) {
            console.log('Invalid number');
            rl.close();
            return;
        }

        const application = data.applications[index];
        updateApplicationStatus(application, data, index);
    });
}

// Update application status
function updateApplicationStatus(application, data, index) {
    console.log(`\nUpdating: ${application.company} - ${application.position}`);
    console.log(`Current status: ${application.status}`);

    // Display possible status options
    console.log('\nCommon statuses:');
    const commonStatuses = [
        'Applied', 'OA', 'First Stage', 'Second Stage', 'Third Stage',
        'Assessment', 'Job Offer', 'Accepted', 'Declined', 'Rejected', 'Ghosted'
    ];

    commonStatuses.forEach((status, i) => {
        console.log(`[${i + 1}] ${status}`);
    });

    rl.question('\nPlease enter new status (you can enter a number or custom status): ', (input) => {
        let status = input;
        const statusIndex = parseInt(input) - 1;

        // If input is a valid number, use the corresponding status
        if (!isNaN(statusIndex) && statusIndex >= 0 && statusIndex < commonStatuses.length) {
            status = commonStatuses[statusIndex];
        }

        const now = getCurrentDate();

        // Update status
        application.status = status;
        application.lastUpdate = now;

        // Add to history
        application.history.push({
            status,
            date: now
        });

        data.applications[index] = application;
        writeData(data);
        console.log(`Status updated to: ${status}`);
        rl.close();
    });
}

// List all applications
function listApplications() {
    const data = readData();

    if (data.applications.length === 0) {
        console.log('No application records');
        rl.close();
        return;
    }

    console.log('\nCurrent application list:');
    console.log('-----------------------------------------------');
    data.applications.forEach((app, index) => {
        console.log(`[${index + 1}] ID: ${app.id}`);
        console.log(`   Company: ${app.company}`);
        console.log(`   Position: ${app.position}`);
        console.log(`   Status: ${app.status}`);
        console.log(`   Last update: ${new Date(app.lastUpdate).toLocaleString()}`);
        console.log('-----------------------------------------------');
    });

    rl.close();
}

// Main function
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log('Please provide a command: add, update, list');
        rl.close();
        return;
    }

    switch (command) {
        case 'add':
            addApplication();
            break;
        case 'update':
            updateApplication();
            break;
        case 'list':
            listApplications();
            break;
        default:
            console.log('Unknown command. Available commands: add, update, list');
            rl.close();
    }
}

// Execute main function
main(); 