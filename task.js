document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskForm = document.getElementById('addTaskForm');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const formTitle = document.getElementById('formTitle');
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskPriorityInput = document.getElementById('taskPriority');
    const taskDeadlineInput = document.getElementById('taskDeadline');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const filterSelect = document.getElementById('filterTasks');
    const sortSelect = document.getElementById('sortTasks');
    const notificationBell = document.getElementById('notificationBell');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsList = document.getElementById('notificationsList');
    const notificationCount = document.getElementById('notificationCount');
    const clearNotifications = document.getElementById('clearNotifications');
    
    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    let editingTaskId = null;
    
    // Initialize the app
    initApp();
    
    function initApp() {
        renderTasks();
        updateNotifications();
        startNotificationChecker();
        
        // Set up event listeners
        taskForm.addEventListener('submit', handleFormSubmit);
        cancelBtn.addEventListener('click', resetForm);
        filterSelect.addEventListener('change', renderTasks);
        sortSelect.addEventListener('change', renderTasks);
        notificationBell.addEventListener('click', toggleNotificationsPanel);
        clearNotifications.addEventListener('click', clearAllNotifications);
        
        // Set default deadline to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
        taskDeadlineInput.value = tomorrow.toISOString().slice(0, 16);
    }
    
    // Form submission handler
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const title = taskTitleInput.value.trim();
        if (!title) return;
        
        const taskData = {
            title: title,
            description: taskDescriptionInput.value.trim(),
            priority: taskPriorityInput.value,
            deadline: taskDeadlineInput.value ? new Date(taskDeadlineInput.value).toISOString() : '',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        if (editingTaskId) {
            // Update existing task
            tasks = tasks.map(task => {
                if (task.id === editingTaskId) {
                    return { ...task, ...taskData };
                }
                return task;
            });
        } else {
            // Add new task
            taskData.id = Date.now().toString();
            tasks.push(taskData);
        }
        
        // Save and reset
        saveTasks();
        resetForm();
        renderTasks();
    }
    
    // Reset form to initial state
    function resetForm() {
        formTitle.textContent = 'Add New Task';
        submitBtn.textContent = 'Add Task';
        cancelBtn.style.display = 'none';
        editingTaskId = null;
        taskForm.reset();
        
        // Reset deadline to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
        taskDeadlineInput.value = tomorrow.toISOString().slice(0, 16);
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Save notifications to localStorage
    function saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }
    
    // Render tasks based on filter and sort options
    function renderTasks() {
        const filterValue = filterSelect.value;
        const sortValue = sortSelect.value;
        
        // Apply filters
        let filteredTasks = [...tasks];
        
        if (filterValue === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filterValue === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (filterValue === 'duesoon') {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            filteredTasks = filteredTasks.filter(task => {
                if (!task.completed && task.deadline) {
                    const taskDate = new Date(task.deadline);
                    return taskDate >= now && taskDate <= tomorrow;
                }
                return false;
            });
        }
        
        // Apply sorting
        filteredTasks.sort((a, b) => {
            if (sortValue === 'deadline') {
                // Handle empty deadlines
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            } else if (sortValue === 'priority') {
                const priorityValues = { high: 3, medium: 2, low: 1 };
                return priorityValues[b.priority] - priorityValues[a.priority];
            } else if (sortValue === 'created') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (sortValue === 'title') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
        
        // Clear current task list
        while (taskList.firstChild) {
            taskList.removeChild(taskList.firstChild);
        }
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        
        // Hide empty state and render tasks
        emptyState.style.display = 'none';
        
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
    
    // Create task element
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        
        // Create task content
        const content = document.createElement('div');
        content.className = 'task-content';
        
        // Title
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        
        // Description (if any)
        let description;
        if (task.description) {
            description = document.createElement('div');
            description.className = 'task-description';
            description.textContent = task.description;
        }
        
        // Task metadata
        const meta = document.createElement('div');
        meta.className = 'task-meta';
        
        // Priority badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `task-priority priority-${task.priority}`;
        priorityBadge.textContent = task.priority;
        
        // Deadline (if any)
        let deadline;
        if (task.deadline) {
            deadline = document.createElement('span');
            const deadlineDate = new Date(task.deadline);
            const formattedDate = formatDate(deadlineDate);
            
            // Check if due soon (within 24 hours)
            const now = new Date();
            const diffHours = (deadlineDate - now) / (1000 * 60 * 60);
            
            if (diffHours > 0 && diffHours < 24 && !task.completed) {
                deadline.className = 'due-soon';
                deadline.innerHTML = `<i class="fas fa-clock"></i> Due soon: ${formattedDate}`;
            } else {
                deadline.innerHTML = `<i class="far fa-calendar-alt"></i> ${formattedDate}`;
            }
        }
        
        // Created date
        const created = document.createElement('span');
        created.innerHTML = `<i class="far fa-calendar-plus"></i> Created: ${formatDate(new Date(task.createdAt))}`;
        
        // Add metadata to meta div
        meta.appendChild(priorityBadge);
        if (deadline) meta.appendChild(deadline);
        meta.appendChild(created);
        
        // Add all elements to content div
        content.appendChild(title);
        if (description) content.appendChild(description);
        content.appendChild(meta);
        
        // Create task actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => editTask(task.id));
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        // Add buttons to actions div
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        // Add all elements to task item
        taskItem.appendChild(checkbox);
        taskItem.appendChild(content);
        taskItem.appendChild(actions);
        
        return taskItem;
    }
    
    // Toggle task completion status
    function toggleTaskCompletion(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
    }
    
    // Edit task
    function editTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Set form fields
        taskTitleInput.value = task.title;
        taskDescriptionInput.value = task.description;
        taskPriorityInput.value = task.priority;
        
        if (task.deadline) {
            // Convert ISO string to local datetime-local format
            const date = new Date(task.deadline);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            taskDeadlineInput.value = date.toISOString().slice(0, 16);
        } else {
            taskDeadlineInput.value = '';
        }
        
        // Update form state
        formTitle.textContent = 'Edit Task';
        submitBtn.textContent = 'Update Task';
        cancelBtn.style.display = 'inline-block';
        editingTaskId = taskId;
        
        // Scroll to form
        taskForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Delete task
    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            
            // Remove related notifications
            notifications = notifications.filter(notif => !notif.id.includes(taskId));
            saveNotifications();
            updateNotifications();
        }
    }
    
    // Format date for display
    function formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString(undefined, options);
    }
    
    // Check for tasks due soon and create notifications
    function checkTaskDeadlines() {
        const now = new Date();
        
        tasks.forEach(task => {
            if (!task.completed && task.deadline) {
                const taskDate = new Date(task.deadline);
                const diffHours = (taskDate - now) / (1000 * 60 * 60);
                
                // Due in less than 24 hours
                if (diffHours > 0 && diffHours < 24) {
                    const notificationId = `${task.id}-24h`;
                    if (!notifications.some(n => n.id === notificationId)) {
                        notifications.push({
                            id: notificationId,
                            message: `Task "${task.title}" is due in less than 24 hours!`,
                            time: new Date().toISOString(),
                            read: false
                        });
                    }
                }
                
                // Due in less than 1 hour
                if (diffHours > 0 && diffHours < 1) {
                    const notificationId = `${task.id}-1h`;
                    if (!notifications.some(n => n.id === notificationId)) {
                        notifications.push({
                            id: notificationId,
                            message: `URGENT: "${task.title}" is due in less than an hour!`,
                            time: new Date().toISOString(),
                            read: false
                        });
                    }
                }
                
                // Overdue
                if (diffHours < 0 && diffHours > -24) {
                    const notificationId = `${task.id}-overdue`;
                    if (!notifications.some(n => n.id === notificationId)) {
                        notifications.push({
                            id: notificationId,
                            message: `Task "${task.title}" is overdue!`,
                            time: new Date().toISOString(),
                            read: false
                        });
                    }
                }
            }
        });
        
        saveNotifications();
        updateNotifications();
    }
    
    // Start notification checker
    function startNotificationChecker() {
        // Check immediately on load
        checkTaskDeadlines();
        
        // Then check every minute
        setInterval(checkTaskDeadlines, 60000);
    }
    
    // Update notifications UI
    function updateNotifications() {
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // Update notification count
        if (unreadCount > 0) {
            notificationCount.textContent = unreadCount;
            notificationCount.style.display = 'flex';
        } else {
            notificationCount.style.display = 'none';
        }
        
        // Clear current notifications list
        notificationsList.innerHTML = '';
        
        // Show message if no notifications
        if (notifications.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'notification-item';
            emptyItem.textContent = 'No notifications';
            notificationsList.appendChild(emptyItem);
            return;
        }
        
        // Sort notifications by time (newest first)
        const sortedNotifications = [...notifications].sort((a, b) => {
            return new Date(b.time) - new Date(a.time);
        });
        
        // Create notification items
        sortedNotifications.forEach(notification => {
            const notifItem = document.createElement('div');
            notifItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
            notifItem.textContent = notification.message;
            
            // Mark as read when clicked
            notifItem.addEventListener('click', () => {
                notification.read = true;
                saveNotifications();
                updateNotifications();
            });
            
            notificationsList.appendChild(notifItem);
        });
    }
    
    // Toggle notifications panel
    function toggleNotificationsPanel(e) {
        e.stopPropagation();
        notificationsPanel.classList.toggle('active');
        
        // Close panel when clicking outside
        if (notificationsPanel.classList.contains('active')) {
            document.addEventListener('click', closeNotificationsPanel);
        } else {
            document.removeEventListener('click', closeNotificationsPanel);
        }
    }
    
    // Close notifications panel
    function closeNotificationsPanel(e) {
        if (!notificationsPanel.contains(e.target) && e.target !== notificationBell) {
            notificationsPanel.classList.remove('active');
            document.removeEventListener('click', closeNotificationsPanel);
        }
    }
    
    // Clear all notifications
    function clearAllNotifications() {
        notifications = [];
        saveNotifications();
        updateNotifications();
        notificationsPanel.classList.remove('active');
    }
});