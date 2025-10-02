// Professional Results Page JavaScript
let mainChart, timelineChart;
let currentChartType = 'bar';
let voteHistory = [];
let currentResultsData = null; // Store current data globally

// Color scheme
const colors = {
    ahmad: {
        primary: '#3498db',
        light: '#ebf5fb',
        gradient: ['#3498db', '#2980b9']
    },
    saad: {
        primary: '#2ecc71',
        light: '#eafaf1',
        gradient: ['#2ecc71', '#27ae60']
    },
    background: ['rgba(52, 152, 219, 0.8)', 'rgba(46, 204, 113, 0.8)'],
    border: ['rgba(52, 152, 219, 1)', 'rgba(46, 204, 113, 1)']
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadResults();
    setupChartSwitcher();
    setInterval(loadResults, 10000); // Refresh every 10 seconds
    
    // Update generation time
    document.getElementById('generationTime').textContent = new Date().toLocaleString();
});

// Setup chart type switcher with loading states
function setupChartSwitcher() {
    const buttons = document.querySelectorAll('.btn-chart');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const newType = this.dataset.type;
            if (newType === currentChartType) return;
            
            switchChartType(newType);
        });
    });
}

// Switch chart type with loading animation
function switchChartType(newType) {
    const buttons = document.querySelectorAll('.btn-chart');
    const chartWrapper = document.querySelector('#mainChart').closest('.chart-wrapper');
    
    // Show loading spinner
    showChartLoading(chartWrapper, newType);
    
    // Disable buttons during transition
    buttons.forEach(btn => btn.disabled = true);
    
    // Update active button immediately
    buttons.forEach(b => b.classList.remove('active'));
    const activeBtn = Array.from(buttons).find(b => b.dataset.type === newType);
    if (activeBtn) activeBtn.classList.add('active');
    
    setTimeout(() => {
        currentChartType = newType;
        updateMainChart(); // Call without parameters - will use stored data
        
        // Hide loading and enable buttons
        setTimeout(() => {
            hideChartLoading(chartWrapper);
            buttons.forEach(btn => btn.disabled = false);
        }, 800);
        
    }, 300);
}

// Show loading spinner for chart - FIXED
function showChartLoading(chartWrapper, chartType) {
    const chartTypeNames = {
        'bar': 'Bar Chart',
        'pie': 'Pie Chart', 
        'doughnut': 'Doughnut Chart'
    };
    
    const loadingHTML = `
        <div class="chart-loading">
            <div class="loading-spinner">
                <i class="fas fa-sync-alt fa-spin"></i>
            </div>
            <p>Loading ${chartTypeNames[chartType]}...</p>
        </div>
    `;
    
    chartWrapper.style.position = 'relative';
    chartWrapper.insertAdjacentHTML('beforeend', loadingHTML);
}

// Hide loading spinner
function hideChartLoading(chartWrapper) {
    const loadingElement = chartWrapper.querySelector('.chart-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// Load results from server
async function loadResults() {
    try {
        const response = await fetch('/results');
        const data = await response.json();

        if (response.ok) {
            currentResultsData = data; // Store data globally
            updateAllDisplays(data);
            addToVoteHistory(data);
            updateTimelineChart();
        } else {
            console.error('Failed to load results');
        }
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

// Update all display elements
function updateAllDisplays(data) {
    updateSummaryCards(data);
    updateMainChart(data); // Pass data here
    updateCandidateDetails(data);
    updateLiveUpdates(data);
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
}

// Update summary cards
function updateSummaryCards(data) {
    const totalVotes = data.totalVotes;
    const candidates = data.candidates;
    
    // Total votes card
    document.getElementById('totalVotes').textContent = totalVotes.toLocaleString();
    
    // Leading candidate card
    const leadingCandidate = candidates.reduce((prev, current) => 
        (prev.votes > current.votes) ? prev : current
    );
    
    document.getElementById('leadingCandidate').textContent = leadingCandidate.candidate;
    document.getElementById('leadingVotes').textContent = `${leadingCandidate.votes} votes (${((leadingCandidate.votes / totalVotes) * 100).toFixed(1)}%)`;
    
    // Turnout rate (demo - assuming 1000 registered voters)
    const turnoutRate = totalVotes > 0 ? ((totalVotes / 1000) * 100).toFixed(1) : 0;
    document.getElementById('turnoutRate').textContent = `${turnoutRate}%`;
}

// Update main chart based on current type - FIXED
function updateMainChart(data = null) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Use provided data or fallback to stored data
    const chartData = data || currentResultsData;
    
    if (!chartData) {
        console.warn('No data available for chart');
        return;
    }
    
    if (mainChart) {
        mainChart.destroy();
    }

    const chartConfig = getChartConfig(chartData, currentChartType);
    mainChart = new Chart(ctx, chartConfig);
}

// Get chart configuration based on type - FIXED
function getChartConfig(data, type) {
    if (!data || !data.candidates) {
        console.error('Invalid data for chart:', data);
        return getEmptyChartConfig(type);
    }

    const labels = data.candidates.map(c => c.candidate);
    const values = data.candidates.map(c => c.votes || 0);

    // Use your predefined colors (adjust if needed)
    const backgroundColors = colors.background.slice(0, labels.length);
    const borderColors = colors.border.slice(0, labels.length);

    const config = {
        type: type === 'bar' ? 'bar' : (type === 'pie' ? 'pie' : 'doughnut'),
        data: {
            labels: labels,
            datasets: [{
                label: 'Votes',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: type === 'bar' ? 8 : 0,
                hoverOffset: type !== 'bar' ? 15 : 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            family: "'Segoe UI', sans-serif"
                        },
                        padding: 20,
                        // For bar chart, color legend labels to match bar colors
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => ({
                                    text: label,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor[i],
                                    lineWidth: 1,
                                    hidden: false,
                                    index: i
                                }));
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 6,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = typeof context.parsed === 'object' ? context.parsed.y : context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} votes (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    };

    if (type === 'bar') {
        config.options.scales = {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 11
                    }
                },
                grid: {
                    display: false
                }
            }
        };
    }

    return config;
}



// Empty chart config for fallback
function getEmptyChartConfig(type) {
    return {
        type: type === 'bar' ? 'bar' : type === 'pie' ? 'pie' : 'doughnut',
        data: {
            labels: ['Ahmad Ammad', 'Saad Jawad'],
            datasets: [{
                data: [0, 0],
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    };
}

// Update candidate details
function updateCandidateDetails(data) {
    const container = document.getElementById('candidateDetails');
    const totalVotes = data.totalVotes;
    
    container.innerHTML = data.candidates.map(candidate => {
        const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
        const isLeading = candidate.votes === Math.max(...data.candidates.map(c => c.votes));
        
        return `
            <div class="candidate-stat ${isLeading ? 'leading' : ''}">
                <div class="candidate-header">
                    <div class="candidate-name">
                        <i class="fas fa-user"></i>
                        ${candidate.candidate}
                        ${isLeading ? '<span class="badge-winner"><i class="fas fa-crown"></i> Leading</span>' : ''}
                    </div>
                    <div class="candidate-votes">${candidate.votes} votes</div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" 
                             style="width: ${percentage}%; 
                                    background: linear-gradient(90deg, ${candidate.candidate === 'Ahmad Ammad' ? colors.ahmad.gradient[0] : colors.saad.gradient[0]} 0%, ${candidate.candidate === 'Ahmad Ammad' ? colors.ahmad.gradient[1] : colors.saad.gradient[1]} 100%);">
                        </div>
                    </div>
                    <div class="progress-text">${percentage}%</div>
                </div>
                <div class="candidate-meta">
                    <span><i class="fas fa-chart-line"></i> ${percentage}% of total</span>
                    <span><i class="fas fa-clock"></i> Last vote: Just now</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Update progress bars in separate container
    updateProgressBars(data);
}

// Update progress bars
function updateProgressBars(data) {
    const container = document.getElementById('progressBars');
    const totalVotes = data.totalVotes;
    
    container.innerHTML = data.candidates.map(candidate => {
        const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0;
        
        return `
            <div class="candidate-progress">
                <div class="progress-info">
                    <span class="candidate-label">${candidate.candidate}</span>
                    <span class="vote-count">${candidate.votes}</span>
                </div>
                <div class="progress-bar-horizontal">
                    <div class="progress-fill-horizontal" 
                         style="width: ${percentage}%;
                                background: ${candidate.candidate === 'Ahmad Ammad' ? colors.ahmad.primary : colors.saad.primary};">
                        <span class="percentage-text">${percentage}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update timeline chart with REAL data
function updateTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    if (timelineChart) {
        timelineChart.destroy();
    }

    // Get real timeline data from vote history
    const timelineData = getTimelineData();
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timelineData.labels,
            datasets: [
                {
                    label: 'Ahmad Ammad',
                    data: timelineData.ahmad,
                    borderColor: colors.ahmad.primary,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: colors.ahmad.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Saad Jawad',
                    data: timelineData.saad,
                    borderColor: colors.saad.primary,
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: colors.saad.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 6
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Votes',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time Intervals',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Get real timeline data from vote history
function getTimelineData() {
    if (voteHistory.length === 0) {
        // If no history, return empty data
        return {
            labels: ['No data yet'],
            ahmad: [0],
            saad: [0]
        };
    }

    // Group votes by time intervals (last 8 intervals)
    const now = new Date();
    const intervals = 8;
    const intervalMinutes = 15; // 15-minute intervals
    
    // Create time labels
    const labels = [];
    for (let i = intervals - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * intervalMinutes * 60000);
        labels.push(time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        }));
    }

    // Initialize vote counts for each interval
    const ahmadVotes = new Array(intervals).fill(0);
    const saadVotes = new Array(intervals).fill(0);

    // Count votes in each interval
    voteHistory.forEach((record, index) => {
        const recordTime = new Date(record.timestamp);
        const minutesDiff = (now - recordTime) / (1000 * 60);
        const intervalIndex = Math.floor(minutesDiff / intervalMinutes);
        
        if (intervalIndex >= 0 && intervalIndex < intervals) {
            const dataIndex = intervals - 1 - intervalIndex;
            if (dataIndex >= 0 && dataIndex < intervals) {
                // Add cumulative votes
                const ahmadCurrent = record.data.candidates.find(c => c.candidate === 'Ahmad Ammad')?.votes || 0;
                const saadCurrent = record.data.candidates.find(c => c.candidate === 'Saad Jawad')?.votes || 0;
                
                ahmadVotes[dataIndex] = Math.max(ahmadVotes[dataIndex], ahmadCurrent);
                saadVotes[dataIndex] = Math.max(saadVotes[dataIndex], saadCurrent);
            }
        }
    });

    // Ensure cumulative progression (votes can't decrease)
    for (let i = 1; i < intervals; i++) {
        ahmadVotes[i] = Math.max(ahmadVotes[i], ahmadVotes[i-1]);
        saadVotes[i] = Math.max(saadVotes[i], saadVotes[i-1]);
    }

    // Fill any gaps with previous values
    for (let i = 1; i < intervals; i++) {
        if (ahmadVotes[i] === 0) ahmadVotes[i] = ahmadVotes[i-1];
        if (saadVotes[i] === 0) saadVotes[i] = saadVotes[i-1];
    }

    return {
        labels: labels,
        ahmad: ahmadVotes,
        saad: saadVotes
    };
}

// Update live updates section
function updateLiveUpdates(data) {
    const container = document.getElementById('updatesList');
    const updates = generateLiveUpdates(data);
    
    container.innerHTML = updates.map(update => `
        <div class="update-item ${update.type}">
            <div class="update-icon">
                <i class="${update.icon}"></i>
            </div>
            <div class="update-content">
                <div class="update-text">${update.text}</div>
                <div class="update-time">${update.time}</div>
            </div>
        </div>
    `).join('');
}

// Generate demo live updates
function generateLiveUpdates(data) {
    const updates = [];
    const now = new Date();
    
    updates.push({
        type: 'vote',
        icon: 'fas fa-vote-yea',
        text: `New vote recorded for ${data.candidates[0].votes > data.candidates[1].votes ? 'Ahmad Ammad' : 'Saad Jawad'}`,
        time: 'Just now'
    });
    
    if (data.totalVotes % 10 === 0 && data.totalVotes > 0) {
        updates.push({
            type: 'milestone',
            icon: 'fas fa-mountain',
            text: `Milestone reached: ${data.totalVotes} total votes cast`,
            time: '2 minutes ago'
        });
    }
    
    updates.push({
        type: 'info',
        icon: 'fas fa-info-circle',
        text: 'Voting is proceeding smoothly across all stations',
        time: '5 minutes ago'
    });
    
    return updates;
}

// Add to vote history for analytics
function addToVoteHistory(data) {
    voteHistory.push({
        timestamp: new Date(),
        data: data
    });
    
    // Keep only last 50 entries
    if (voteHistory.length > 50) {
        voteHistory.shift();
    }
}

// Manual refresh function
window.refreshResults = function() {
    const btn = document.querySelector('.btn-refresh');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    btn.disabled = true;
    
    loadResults();
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
};

// Export results function
window.exportResults = function() {
    // Implementation for exporting results
    alert('Export feature would be implemented here!');
};