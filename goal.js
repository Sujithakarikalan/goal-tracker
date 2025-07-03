let goals = [];

// DOM Elements
const goalsContainer = document.getElementById('goalsContainer');
const addGoalBtn = document.getElementById('addGoalBtn');
const goalModal = document.getElementById('goalModal');
const milestoneModal = document.getElementById('milestoneModal');
const closeModal = document.getElementById('closeModal');
const closeMilestoneModal = document.getElementById('closeMilestoneModal');
const goalForm = document.getElementById('goalForm');
const milestoneForm = document.getElementById('milestoneForm');
const cancelGoal = document.getElementById('cancelGoal');
const cancelMilestone = document.getElementById('cancelMilestone');
const tabs = document.querySelectorAll('.tab');

// Load goals from localStorage
function loadGoals() {
  const savedGoals = localStorage.getItem('goals');
  if (savedGoals) {
    goals = JSON.parse(savedGoals);
  }
  renderGoals();
}

// Save goals to localStorage
function saveGoals() {
  localStorage.setItem('goals', JSON.stringify(goals));
}

// Generate unique ID for goals and milestones
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Format date for display
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Calculate days remaining
function getDaysRemaining(targetDate) {
  const today = new Date();
  const target = new Date(targetDate);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  
  const timeDiff = target - today;
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return daysDiff;
}

// Calculate goal progress based on milestones
function calculateProgress(goal) {
  if (!goal.milestones || goal.milestones.length === 0) {
    return 0;
  }

  const completedMilestones = goal.milestones.filter(milestone => milestone.completed).length;
  return Math.round((completedMilestones / goal.milestones.length) * 100);
}

// Render all goals or filtered by type
function renderGoals(type = 'all') {
  goalsContainer.innerHTML = '';

  let filteredGoals = goals;
  if (type !== 'all') {
    filteredGoals = goals.filter(goal => goal.type === type);
  }

  if (filteredGoals.length === 0) {
    goalsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <h3>No Goals Yet</h3>
        <p>Start by adding your first goal!</p>
      </div>
    `;
    return;
  }

  filteredGoals.forEach(goal => {
    const progress = calculateProgress(goal);
    const daysRemaining = getDaysRemaining(goal.targetDate);
    const typeBadge = goal.type === 'short' ? 'short-term' : 'long-term';
    const typeText = goal.type === 'short' ? 'Short-term' : 'Long-term';

    const goalElement = document.createElement('div');
    goalElement.className = 'goal-card';
    goalElement.innerHTML = `
      <div class="goal-header">
        <h3 class="goal-title">${goal.title}</h3>
        <span class="goal-type-badge ${typeBadge}">${typeText}</span>
      </div>
      <p class="goal-date">
        Target: ${formatDate(goal.targetDate)} 
        (${daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Overdue'})
      </p>
      <p class="goal-description">${goal.description || 'No description added.'}</p>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-text">
          <span>Progress</span>
          <span>${progress}%</span>
        </div>
      </div>

      <div class="milestones-header">
        <h4 class="milestones-title">Milestones</h4>
        <button class="add-milestone-btn" data-goal-id="${goal.id}">+</button>
      </div>
      <ul class="milestone-list">
        ${renderMilestones(goal)}
      </ul>

      <div class="goal-actions">
        <button class="btn btn-primary edit-goal" data-goal-id="${goal.id}">Edit</button>
        <button class="btn btn-danger delete-goal" data-goal-id="${goal.id}">Delete</button>
      </div>
    `;

    goalsContainer.appendChild(goalElement);
  });

  // Add event listeners for milestone checkboxes and delete buttons
  document.querySelectorAll('.milestone-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', toggleMilestoneCompletion);
  });

  document.querySelectorAll('.milestone-delete').forEach(button => {
    button.addEventListener('click', deleteMilestone);
  });

  // Add event listeners for goal actions
  document.querySelectorAll('.edit-goal').forEach(button => {
    button.addEventListener('click', editGoal);
  });

  document.querySelectorAll('.delete-goal').forEach(button => {
    button.addEventListener('click', deleteGoal);
  });

  // Add event listeners for adding milestones
  document.querySelectorAll('.add-milestone-btn').forEach(button => {
    button.addEventListener('click', openMilestoneModal);
  });
}

// Render milestones for a goal
function renderMilestones(goal) {
  if (!goal.milestones || goal.milestones.length === 0) {
    return '<li>No milestones added yet.</li>';
  }

  return goal.milestones.map(milestone => `
    <li class="milestone-item">
      <input type="checkbox" class="milestone-checkbox" 
        data-goal-id="${goal.id}" 
        data-milestone-id="${milestone.id}" 
        ${milestone.completed ? 'checked' : ''}>
      <span class="milestone-text ${milestone.completed ? 'milestone-completed' : ''}">
        ${milestone.text}
        <span class="milestone-date">by ${formatDate(milestone.date)}</span>
      </span>
      <button class="milestone-delete" data-goal-id="${goal.id}" data-milestone-id="${milestone.id}">×</button>
    </li>
  `).join('');
}

// Toggle milestone completion status
function toggleMilestoneCompletion(e) {
  const goalId = e.target.dataset.goalId;
  const milestoneId = e.target.dataset.milestoneId;
  const isCompleted = e.target.checked;

  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return;

  const milestoneIndex = goals[goalIndex].milestones.findIndex(m => m.id === milestoneId);
  if (milestoneIndex === -1) return;

  goals[goalIndex].milestones[milestoneIndex].completed = isCompleted;
  saveGoals();

  // Update UI
  const textElement = e.target.nextElementSibling;
  if (isCompleted) {
    textElement.classList.add('milestone-completed');
  } else {
    textElement.classList.remove('milestone-completed');
  }

  // Update progress bar
  const goalCard = e.target.closest('.goal-card');
  const progressFill = goalCard.querySelector('.progress-fill');
  const progressText = goalCard.querySelector('.progress-text span:last-child');
  const progress = calculateProgress(goals[goalIndex]);
  
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;
}

// Delete a milestone
function deleteMilestone(e) {
  const goalId = e.target.dataset.goalId;
  const milestoneId = e.target.dataset.milestoneId;

  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex === -1) return;

  goals[goalIndex].milestones = goals[goalIndex].milestones.filter(m => m.id !== milestoneId);
  saveGoals();

  // Re-render the entire goal to update progress
  renderGoals(getActiveTabType());
}

// Edit a goal
function editGoal(e) {
  const goalId = e.target.dataset.goalId;
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return;

  document.getElementById('modalTitle').textContent = 'Edit Goal';
  document.getElementById('goalId').value = goal.id;
  document.getElementById('goalTitle').value = goal.title;
  document.getElementById('goalDescription').value = goal.description || '';
  document.getElementById('goalType').value = goal.type;
  document.getElementById('targetDate').value = goal.targetDate;

  goalModal.classList.add('active');
}

// Delete a goal
function deleteGoal(e) {
  if (!confirm('Are you sure you want to delete this goal?')) return;

  const goalId = e.target.dataset.goalId;
  goals = goals.filter(g => g.id !== goalId);
  saveGoals();
  renderGoals(getActiveTabType());
}

// Open milestone modal
function openMilestoneModal(e) {
  const goalId = e.target.dataset.goalId;
  document.getElementById('milestoneGoalId').value = goalId;
  
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('milestoneDate').value = tomorrow.toISOString().split('T')[0];
  
  document.getElementById('milestoneText').value = '';
  milestoneModal.classList.add('active');
}

// Get current active tab type
function getActiveTabType() {
  const activeTab = document.querySelector('.tab.active');
  return activeTab ? activeTab.dataset.type : 'all';
}

// Event Listeners
window.addEventListener('DOMContentLoaded', loadGoals);

addGoalBtn.addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Add New Goal';
  document.getElementById('goalId').value = '';
  document.getElementById('goalTitle').value = '';
  document.getElementById('goalDescription').value = '';
  document.getElementById('goalType').value = 'short';
  
  // Set default date to next week
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById('targetDate').value = nextWeek.toISOString().split('T')[0];
  
  goalModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
  goalModal.classList.remove('active');
});

closeMilestoneModal.addEventListener('click', () => {
  milestoneModal.classList.remove('active');
});

cancelGoal.addEventListener('click', () => {
  goalModal.classList.remove('active');
});

cancelMilestone.addEventListener('click', () => {
  milestoneModal.classList.remove('active');
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderGoals(tab.dataset.type);
  });
});

goalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const goalId = document.getElementById('goalId').value;
  const title = document.getElementById('goalTitle').value;
  const description = document.getElementById('goalDescription').value;
  const type = document.getElementById('goalType').value;
  const targetDate = document.getElementById('targetDate').value;

  if (goalId) {
    // Update existing goal
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex !== -1) {
      goals[goalIndex].title = title;
      goals[goalIndex].description = description;
      goals[goalIndex].type = type;
      goals[goalIndex].targetDate = targetDate;
    }
  } else {
    // Add new goal
    const newGoal = {
      id: generateId(),
      title,
      description,
      type,
      targetDate,
      milestones: []
    };
    goals.push(newGoal);
  }

  saveGoals();
  renderGoals(getActiveTabType());
  goalModal.classList.remove('active');
});

milestoneForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const goalId = document.getElementById('milestoneGoalId').value;
  const text = document.getElementById('milestoneText').value;
  const date = document.getElementById('milestoneDate').value;

  const goalIndex = goals.findIndex(g => g.id === goalId);
  if (goalIndex !== -1) {
    const newMilestone = {
      id: generateId(),
      text,
      date,
      completed: false
    };
    
    if (!goals[goalIndex].milestones) {
      goals[goalIndex].milestones = [];
    }
    
    goals[goalIndex].milestones.push(newMilestone);
    saveGoals();
    renderGoals(getActiveTabType());
  }
  
  milestoneModal.classList.remove('active');
});
window.addEventListener('click', (e) => {
    if (e.target === goalModal) {
      goalModal.classList.remove('active');
    }
    if (e.target === milestoneModal) {
      milestoneModal.classList.remove('active');
    }
  });