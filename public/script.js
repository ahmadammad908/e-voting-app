// Utility Functions
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Common DOM Ready Function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize user email display if on voting page
    if (document.getElementById('userEmail')) {
        // This would typically come from session, but for demo we'll show placeholder
        document.getElementById('userEmail').textContent = 'Voter • Verified';
    }
});

// Login Page Functionality
if (document.getElementById('emailForm')) {
    const emailForm = document.getElementById('emailForm');
    const otpForm = document.getElementById('otpForm');
    const resendOtp = document.getElementById('resendOtp');
    let currentEmail = '';

    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();
        
        const email = document.getElementById('email').value.trim();
        currentEmail = email;

        if (!email) {
            showMessage('Please enter your email address');
            return;
        }

        // Show loading state
        const submitBtn = emailForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                emailForm.style.display = 'none';
                otpForm.style.display = 'block';
                showMessage('OTP sent to your email. Please check your inbox!', 'success');
                // Auto-focus OTP input
                document.getElementById('otp').focus();
            } else {
                showMessage(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('OTP send error:', error);
            showMessage('Network error. Please check your connection and try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessage();
        
        const otp = document.getElementById('otp').value.trim();

        if (!otp || otp.length !== 6) {
            showMessage('Please enter a valid 6-digit OTP');
            return;
        }

        // Show loading state
        const submitBtn = otpForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email: currentEmail, 
                    otp: otp 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    if (data.hasVoted) {
                        window.location.href = './results.html';
                    } else {
                        window.location.href = '/voting';
                    }
                }, 1500);
            } else {
                showMessage(data.error || 'Invalid OTP');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            showMessage('Network error. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    resendOtp.addEventListener('click', async () => {
        hideMessage();
        
        if (!currentEmail) {
            showMessage('Please enter your email first');
            return;
        }

        // Show loading state
        resendOtp.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resending...';
        resendOtp.disabled = true;

        try {
            const response = await fetch('/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: currentEmail }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('New OTP sent to your email!', 'success');
            } else {
                showMessage(data.error || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            showMessage('Failed to resend OTP. Please try again.');
        } finally {
            setTimeout(() => {
                resendOtp.innerHTML = 'Resend OTP';
                resendOtp.disabled = false;
            }, 2000);
        }
    });

    // Auto-tab OTP input
    document.getElementById('otp')?.addEventListener('input', function(e) {
        if (this.value.length === 6) {
            document.querySelector('#otpForm button[type="submit"]').focus();
        }
    });
}

// Voting Page Functionality
if (document.getElementById('votingSection')) {
    let selectedCandidate = '';
    
    // Check if user has already voted
    async function checkVoteStatus() {
        try {
            const response = await fetch('/vote/cast', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ candidate: 'check' })
            });
            
            if (response.status === 400) {
                const data = await response.json();
                if (data.error === 'You have already voted') {
                    // User has voted, redirect to results
                    window.location.href = '/results';
                    return;
                }
            }
            
            // If we get here, user hasn't voted yet
            initializeVotingPage();
            
        } catch (error) {
            console.error('Error checking vote status:', error);
            showMessage('Error checking vote status. Please refresh the page.', 'error');
        }
    }

    function initializeVotingPage() {
        // Add click handlers to candidate cards
        const candidateCards = document.querySelectorAll('.candidate-card');
        candidateCards.forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-vote')) {
                    const candidate = this.dataset.candidate;
                    showVoteConfirmation(candidate);
                }
            });
        });

        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === '1') {
                showVoteConfirmation('Ahmad Ammad');
            } else if (e.key === '2') {
                showVoteConfirmation('Saad Jawad');
            }
        });
    }

    // Show vote confirmation modal
    window.showVoteConfirmation = function(candidate) {
        selectedCandidate = candidate;
        const modal = document.getElementById('voteModal');
        const candidateName = document.getElementById('selectedCandidateName');
        
        candidateName.textContent = candidate;
        candidateName.className = 'selected-candidate ' + (candidate === 'Ahmad Ammad' ? 'ahmad' : 'saad');
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add animation class
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    // Close modal
    window.closeModal = function() {
        const modal = document.getElementById('voteModal');
        modal.classList.remove('active');
        
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            selectedCandidate = '';
        }, 300);
    }

    // Confirm and cast vote
    window.confirmVote = async function() {
        if (!selectedCandidate) {
            showMessage('No candidate selected', 'error');
            return;
        }

        // Show loading state in modal
        const confirmBtn = document.querySelector('.btn-confirm');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Casting Vote...';
        confirmBtn.disabled = true;

        try {
            const response = await fetch('/vote/cast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ candidate: selectedCandidate }),
            });

            const data = await response.json();

            if (response.ok) {
                closeModal();
                showSuccessScreen(selectedCandidate);
                
                // Track vote in localStorage for demo purposes
                localStorage.setItem('hasVoted', 'true');
                localStorage.setItem('votedCandidate', selectedCandidate);
                
            } else {
                throw new Error(data.error || 'Failed to cast vote');
            }
        } catch (error) {
            console.error('Vote error:', error);
            showMessage(error.message || 'Failed to cast vote. Please try again.', 'error');
            
            // Reset button
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }

    // Show success screen after voting
    function showSuccessScreen(candidate) {
        document.getElementById('votingSection').style.display = 'none';
        document.getElementById('votedSection').style.display = 'block';
        document.getElementById('votedCandidate').textContent = candidate;
        
        // Add celebration effect
        celebrateVote();
    }

    // Celebration effect
    function celebrateVote() {
        const successSection = document.getElementById('votedSection');
        successSection.classList.add('celebrate');
        
        // Add confetti effect (simple CSS version)
        createConfetti();
        
        setTimeout(() => {
            successSection.classList.add('celebrated');
        }, 100);
    }

    // Simple confetti effect
    function createConfetti() {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
        const container = document.querySelector('.container');
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -10px;
                left: ${Math.random() * 100}%;
                opacity: 0.8;
                border-radius: 1px;
                z-index: 1000;
                animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            
            container.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('voteModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // Check vote status on page load
    checkVoteStatus();
}

// Results Page Functionality
if (document.getElementById('resultsChart')) {
    let mainChart, timelineChart;
    let currentChartType = 'bar';
    let voteHistory = [];

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
        
        // Check if user has voted and show message
        const hasVoted = localStorage.getItem('hasVoted');
        if (hasVoted) {
            const votedCandidate = localStorage.getItem('votedCandidate');
            showMessage(`Thank you for voting! You voted for ${votedCandidate}.`, 'success');
        }
    });

    // Setup chart type switcher
    function setupChartSwitcher() {
        const buttons = document.querySelectorAll('.btn-chart');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentChartType = this.dataset.type;
                if (mainChart) {
                    updateMainChart();
                }
            });
        });
    }

    // Load results from server
    async function loadResults() {
        try {
            const response = await fetch('/results');
            const data = await response.json();

            if (response.ok) {
                updateAllDisplays(data);
                addToVoteHistory(data);
                updateTimelineChart();
            } else {
                console.error('Failed to load results');
                showMessage('Failed to load results. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error loading results:', error);
            showMessage('Network error. Please check your connection.', 'error');
        }
    }

    // Update all display elements
    function updateAllDisplays(data) {
        updateSummaryCards(data);
        updateMainChart(data);
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
        document.getElementById('leadingVotes').textContent = `${leadingCandidate.votes} votes (${totalVotes > 0 ? ((leadingCandidate.votes / totalVotes) * 100).toFixed(1) : 0}%)`;
        
        // Turnout rate (demo - assuming 1000 registered voters)
        const turnoutRate = totalVotes > 0 ? ((totalVotes / 1000) * 100).toFixed(1) : 0;
        document.getElementById('turnoutRate').textContent = `${turnoutRate}%`;
    }

    // Update main chart based on current type
    function updateMainChart(data) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        
        if (mainChart) {
            mainChart.destroy();
        }

        const chartConfig = getChartConfig(data, currentChartType);
        mainChart = new Chart(ctx, chartConfig);
    }

    // Get chart configuration based on type
    function getChartConfig(data, type) {
        const commonConfig = {
            data: {
                labels: data.candidates.map(c => c.candidate),
                datasets: [{
                    data: data.candidates.map(c => c.votes),
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 2,
                    borderRadius: type === 'bar' ? 8 : 0
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
                            padding: 20
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
                                const total = data.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.parsed} votes (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        // Type-specific configurations
        switch(type) {
            case 'pie':
            case 'doughnut':
                commonConfig.type = type;
                commonConfig.options.cutout = type === 'doughnut' ? '50%' : 0;
                break;
            case 'bar':
            default:
                commonConfig.type = 'bar';
                commonConfig.options.scales = {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: Math.max(1, Math.ceil(Math.max(...data.candidates.map(c => c.votes)) / 5)),
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                };
                break;
        }

        return commonConfig;
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

    // Update timeline chart
    function updateTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        
        if (timelineChart) {
            timelineChart.destroy();
        }

        // Demo timeline data - in real app, this would come from vote history
        const labels = ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        const ahmadData = [5, 15, 25, 40, 55, 70, 85, 95];
        const saadData = [3, 12, 22, 35, 50, 65, 80, 90];

        timelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ahmad Ammad',
                        data: ahmadData,
                        borderColor: colors.ahmad.primary,
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Saad Jawad',
                        data: saadData,
                        borderColor: colors.saad.primary,
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Votes'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
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
        // Simple export implementation
        const data = {
            title: 'E-Voting Demo Results',
            timestamp: new Date().toISOString(),
            totalVotes: document.getElementById('totalVotes').textContent,
            generatedBy: 'Demo E-Voting System'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `election-results-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showMessage('Results exported successfully!', 'success');
    };
}

// Add confetti animation to CSS via JavaScript
const style = document.createElement('style');
style.textContent = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .confetti {
        pointer-events: none;
    }
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    .modal.active .modal-content {
        animation: modalSlideIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Online/offline detection
window.addEventListener('online', function() {
    showMessage('Connection restored!', 'success');
    setTimeout(() => {
        hideMessage();
    }, 3000);
});

window.addEventListener('offline', function() {
    showMessage('You are currently offline. Some features may not work.', 'error');
});

// Page visibility detection (for auto-refresh)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && document.getElementById('resultsChart')) {
        // Page became visible, refresh results
        loadResults();
    }
});