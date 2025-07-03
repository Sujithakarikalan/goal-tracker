// DOM Elements
const activityForm = document.getElementById('activity-form');
const activityList = document.getElementById('activity-list');
const totalHoursElement = document.getElementById('totalHours');
const completedTasksElement = document.getElementById('completedTasks');
const productivityScoreElement = document.getElementById('productivityScore');
const insightsContainer = document.getElementById('insights-container');
const productivityRating = document.getElementById('productivity-rating');
const ratingValue = document.getElementById('rating-value');
const weeklyChartCanvas = document.getElementById('weeklyChart');

// Chart instance
let weeklyChart;

// Initialize data from localStorage or set defaults
let activities = JSON.parse(localStorage.getItem('productivityActivities')) || [];

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as the default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('activity-date').value = today;
    
    // Update rating display
    productivityRating.addEventListener('input', function() {
        ratingValue.textContent = this.value;
    });
    
    // Render initial data
    renderActivities();
    updateSummary();
    renderChart();
    generateInsights();
});

// Form submission
activityForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const date = document.getElementById('activity-date').value;
    const type = document.getElementById('activity-type').value;
    const hours = parseFloat(document.getElementById('activity-hours').value);
    const description = document.getElementById('activity-description').value;
    const rating = parseInt(document.getElementById('productivity-rating').value);
    
    // Create new activity object
    const newActivity = {
        id: Date.now(),
        date,
        type,
        hours,
        description,
        rating
    };
    
    // Add to activities array
    activities.push(newActivity);
    
    // Save to localStorage
    saveActivities();
    
    // Reset form
    activityForm.reset();
    document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('productivity-rating').value = 7;
    ratingValue.textContent = '7';
    
    // Update UI
    renderActivities();
    updateSummary();
    renderChart();
    generateInsights();
    
    // Show success message
    alert('Activity logged successfully!');
});

// Delete activity
function deleteActivity(id) {
    activities = activities.filter(activity => activity.id !== id);
    saveActivities();
    renderActivities();
    updateSummary();
    renderChart();
    generateInsights();
}

// Save activities to localStorage
function saveActivities() {
    localStorage.setItem('productivityActivities', JSON.stringify(activities));
}

// Render activities table
function renderActivities() {
    activityList.innerHTML = '';
    
    // Sort activities by date (newest first)
    const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedActivities.length === 0) {
        activityList.innerHTML = `<tr><td colspan="5" class="no-data">No activities logged yet</td></tr>`;
        return;
    }
    
    sortedActivities.forEach(activity => {
        const row = document.createElement('tr');
        
        // Format date for display
        const displayDate = new Date(activity.date).toLocaleDateString();
        
        row.innerHTML = `
            <td>${displayDate}</td>
            <td>${formatActivityType(activity.type)}</td>
            <td>${activity.hours}</td>
            <td>${activity.rating}/10</td>
            <td>
                <button class="btn-delete" onclick="deleteActivity(${activity.id})">Delete</button>
            </td>
        `;
        
        activityList.appendChild(row);
    });
}

// Format activity type for display
function formatActivityType(type) {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

// Update summary section
function updateSummary() {
    // Get current week's activities
    const currentWeekActivities = getActivitiesForCurrentWeek();
    
    // Calculate total hours
    const totalHours = currentWeekActivities.reduce((sum, activity) => sum + activity.hours, 0);
    
    // Count completed tasks
    const completedTasks = currentWeekActivities.length;
    
    // Calculate average productivity score
    let avgScore = 0;
    if (completedTasks > 0) {
        avgScore = currentWeekActivities.reduce((sum, activity) => sum + activity.rating, 0) / completedTasks;
    }
    
    // Update DOM
    totalHoursElement.textContent = totalHours.toFixed(1);
    completedTasksElement.textContent = completedTasks;
    productivityScoreElement.textContent = avgScore.toFixed(1);
}

// Get activities for current week
function getActivitiesForCurrentWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return activities.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate >= startOfWeek && activityDate <= endOfWeek;
    });
}

// Render weekly chart
function renderChart() {
    // Prepare data for the chart
    const activityTypes = ['coding', 'meeting', 'learning', 'planning', 'other'];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get current week's activities
    const currentWeekActivities = getActivitiesForCurrentWeek();
    
    // Initialize dataset
    const datasets = activityTypes.map(type => {
        return {
            label: formatActivityType(type),
            data: Array(7).fill(0), // One for each day of the week
            backgroundColor: getColorForType(type),
        };
    });
    
    // Fill in actual data
    currentWeekActivities.forEach(activity => {
        const date = new Date(activity.date);
        const dayIndex = date.getDay(); // 0 for Sunday, 6 for Saturday
        
        const typeIndex = activityTypes.indexOf(activity.type);
        if (typeIndex !== -1) {
            datasets[typeIndex].data[dayIndex] += activity.hours;
        }
    });
    
    // Destroy existing chart if it exists
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    // Create new chart
    weeklyChart = new Chart(weeklyChartCanvas, {
        type: 'bar',
        data: {
            labels: daysOfWeek,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Weekly Activities Breakdown'
                }
            }
        }
    });
}

// Get color for activity type
function getColorForType(type) {
    const colors = {
        coding: 'rgba(76, 110, 245, 0.8)',
        meeting: 'rgba(34, 139, 230, 0.8)',
        learning: 'rgba(64, 192, 87, 0.8)',
        planning: 'rgba(253, 126, 20, 0.8)',
        other: 'rgba(173, 181, 189, 0.8)'
    };
    
    return colors[type] || colors.other;
}

// Generate insights
function generateInsights() {
    insightsContainer.innerHTML = '';
    
    // Get current week's activities
    const currentWeekActivities = getActivitiesForCurrentWeek();
    
    if (currentWeekActivities.length === 0) {
        insightsContainer.innerHTML = `<p class="no-data">Add activities to see personalized insights</p>`;
        return;
    }
    
    // Calculate some metrics
    const totalHours = currentWeekActivities.reduce((sum, activity) => sum + activity.hours, 0);
    const avgRating = currentWeekActivities.reduce((sum, activity) => sum + activity.rating, 0) / currentWeekActivities.length;
    
    // Group by type
    const byType = {};
    currentWeekActivities.forEach(activity => {
        if (!byType[activity.type]) {
            byType[activity.type] = [];
        }
        byType[activity.type].push(activity);
    });
    
    // Calculate hours by type
    const hoursByType = {};
    Object.keys(byType).forEach(type => {
        hoursByType[type] = byType[type].reduce((sum, activity) => sum + activity.hours, 0);
    });
    
    // Generate insights
    const insights = [];
    
    // Overall productivity insight
    if (avgRating >= 8) {
        insights.push({
            text: `Great job! Your average productivity rating this week is ${avgRating.toFixed(1)}/10.`,
            type: 'positive'
        });
    } else if (avgRating >= 5) {
        insights.push({
            text: `Your average productivity rating this week is ${avgRating.toFixed(1)}/10. Look for ways to improve focus.`,
            type: 'warning'
        });
    } else {
        insights.push({
            text: `Your productivity rating is low (${avgRating.toFixed(1)}/10). Try to identify what's affecting your focus.`,
            type: 'negative'
        });
    }
    
    // Time distribution insight
    const mostTimeType = Object.keys(hoursByType).reduce((a, b) => hoursByType[a] > hoursByType[b] ? a : b, '');
    if (mostTimeType) {
        const percentage = (hoursByType[mostTimeType] / totalHours * 100).toFixed(1);
        insights.push({
            text: `You spent ${percentage}% of your time on ${formatActivityType(mostTimeType)} this week.`,
            type: 'neutral'
        });
        
        // Check if too much time on meetings
        if (mostTimeType === 'meeting' && percentage > 40) {
            insights.push({
                text: `You're spending a lot of time in meetings. Consider if some could be emails or shorter.`,
                type: 'warning'
            });
        }
    }
    
    // Activity balance insight
    if (Object.keys(hoursByType).length <= 2 && totalHours > 10) {
        insights.push({
            text: `Your activities seem narrowly focused. Consider diversifying your work for better balance.`,
            type: 'warning'
        });
    }
    
    // Render insights
    insights.forEach(insight => {
        const insightElement = document.createElement('div');
        insightElement.className = `insight-item ${insight.type}`;
        insightElement.textContent = insight.text;
        insightsContainer.appendChild(insightElement);
    });
    
    // Add suggestion based on data
    const suggestion = document.createElement('div');
    suggestion.className = 'insight-item';
    
    if (totalHours < 10) {
        suggestion.textContent = 'Try logging more of your activities to get better insights!';
    } else if (avgRating < 6) {
        suggestion.textContent = 'Consider breaking down your work into smaller, more manageable tasks to improve focus.';
    } else {
        const leastProductiveType = Object.keys(byType).reduce((a, b) => {
            const avgA = byType[a].reduce((sum, act) => sum + act.rating, 0) / byType[a].length;
            const avgB = byType[b].reduce((sum, act) => sum + act.rating, 0) / byType[b].length;
            return avgA < avgB ? a : b;
        });
        
        suggestion.textContent = `You seem less productive when doing ${formatActivityType(leastProductiveType)} activities. Try scheduling these during your peak energy hours.`;
    }
    
    insightsContainer.appendChild(suggestion);
}