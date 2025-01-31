document.getElementById('current-date').innerText = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

let taskList = document.getElementById('task-list');

function addTarget(event) {
  if (event.key === 'Enter') {
    const targetInput = document.getElementById('target-input');
    if (targetInput.value.trim()) {
      addTask(targetInput.value.trim());
      targetInput.value = '';
      saveToLocalStorage();
    }
  }
}

function addTask(taskText, completed = false, subtasks = []) {
  const newTask = document.createElement('li');
  newTask.classList.add('task');
  newTask.innerHTML = `
  <input type="checkbox" class="task-checkbox" ${completed ? 'checked' : ''} onclick="toggleTaskCompletion(this)">
  <span class="task-text" contenteditable="true" ondblclick="toggleSubtaskCard(this)">${taskText}</span>
  <button class="task-delete" onclick="deleteTask(this)"><i class="fas fa-trash-alt"></i></button>
`;
  taskList.appendChild(newTask);
  
  const subtaskContainer = document.createElement('div');
  subtaskContainer.classList.add('subtask-container');
  subtaskContainer.innerHTML = `
  <input type="text" class="subtask-input" placeholder="I should..." onkeydown="addSubtask(event, this)">
  <ul class="subtask-list"></ul>
`;
  newTask.insertAdjacentElement('afterend', subtaskContainer);
  
  subtasks.forEach(sub => addSubtaskFromStorage(subtaskContainer, sub.text, sub.completed, sub.elapsedTime));
}

function addSubtask(event, input) {
  if (event.key === 'Enter' && input.value.trim()) {
    addSubtaskFromStorage(input.closest('.subtask-container'), input.value.trim());
    input.value = '';
    saveToLocalStorage();
  }
}

function addSubtaskFromStorage(container, text, completed = false, elapsedTime = 0) {
  const subtaskList = container.querySelector('.subtask-list');
  const newSubtask = document.createElement('li');
  newSubtask.classList.add('subtask');
  newSubtask.draggable = true;
  newSubtask.innerHTML = `
  <input type="checkbox" class="subtask-checkbox" ${completed ? 'checked' : ''} onclick="toggleSubtaskCompletion(this)">
  <span class="subtask-text" contenteditable="true">${text}</span>
  <span class="stopwatch" data-time="${elapsedTime}">00:00:00</span>
  <button class="stopwatch-btn" onclick="toggleStopwatch(this)">▶️</button>
  <button class="subtask-delete" onclick="deleteSubtask(this)"><i class="fas fa-trash-alt"></i></button>
`;
  subtaskList.appendChild(newSubtask);
  addDragAndDropHandlers(newSubtask);
  updateStopwatchDisplay(newSubtask.querySelector('.stopwatch'));
}

function toggleStopwatch(button) {
  const stopwatch = button.previousElementSibling;
  if (stopwatch.dataset.running === "true") {
    clearInterval(stopwatch.dataset.timer);
    stopwatch.dataset.running = "false";
    button.innerHTML = "▶️";
  } else {
    stopwatch.dataset.running = "true";
    button.innerHTML = "⏸️";
    startStopwatch(stopwatch);
  }
  saveToLocalStorage();
}

function startStopwatch(stopwatch) {
  let elapsedTime = parseInt(stopwatch.dataset.time) || 0;
  const update = () => {
    elapsedTime++;
    stopwatch.dataset.time = elapsedTime;
    updateStopwatchDisplay(stopwatch);
    saveToLocalStorage();
  };
  stopwatch.dataset.timer = setInterval(update, 1000);
}

function updateStopwatchDisplay(stopwatch) {
  let elapsedTime = parseInt(stopwatch.dataset.time) || 0;
  let hours = Math.floor(elapsedTime / 3600);
  let minutes = Math.floor((elapsedTime % 3600) / 60);
  let seconds = elapsedTime % 60;
  stopwatch.innerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function toggleTaskCompletion(checkbox) {
  const taskText = checkbox.closest('.task').querySelector('.task-text');
  if (checkbox.checked) {
    taskText.classList.add('strike-through');
  } else {
    taskText.classList.remove('strike-through');
  }
  saveToLocalStorage();
}

function toggleSubtaskCompletion(checkbox) {
  const subtaskText = checkbox.closest('.subtask').querySelector('.subtask-text');
  if (checkbox.checked) {
    subtaskText.classList.add('strike-through');
  } else {
    subtaskText.classList.remove('strike-through');
  }
  saveToLocalStorage();
}

function deleteTask(button) {
  button.closest('.task').nextElementSibling.remove();
  button.closest('.task').remove();
  saveToLocalStorage();
}

function deleteSubtask(button) {
  const stopwatch = button.previousElementSibling.previousElementSibling;
  clearInterval(stopwatch.dataset.timer);
  button.closest('.subtask').remove();
  saveToLocalStorage();
}

function toggleSubtaskCard(taskText) {
  const subtaskContainer = taskText.closest('.task').nextElementSibling;
  subtaskContainer.style.display = subtaskContainer.style.display === 'none' || subtaskContainer.style.display === '' ? 'block' : 'none';
  
  if (subtaskContainer.style.display === 'block') {
    const subtaskInput = subtaskContainer.querySelector('.subtask-input');
    subtaskInput.focus();
  }
}

function saveToLocalStorage() {
  const tasks = [];
  
  // Save tasks with subtasks and stopwatch data
  document.querySelectorAll('.task').forEach(task => {
    const taskText = task.querySelector('.task-text').innerText;
    const completed = task.querySelector('.task-checkbox').checked;
    const subtasks = [...task.nextElementSibling.querySelectorAll('.subtask')].map(sub => ({
      text: sub.querySelector('.subtask-text').innerText,
      completed: sub.querySelector('.subtask-checkbox').checked,
      elapsedTime: sub.querySelector('.stopwatch').dataset.time || 0
    }));
    tasks.push({ text: taskText, completed, subtasks });
  });
  
  // Save blockquote content if present
  const blockquote = document.querySelector('blockquote[contenteditable="True"]');
  const blockquoteText = blockquote ? blockquote.innerText.trim() : '';
  
  // Store tasks and blockquote in local storage
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('blockquote', blockquoteText);
}

function addDragAndDropHandlers(item) {
  item.addEventListener('dragstart', () => {
    item.classList.add('dragging');
  });
  
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
    saveToLocalStorage();
  });
  
  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    const siblings = [...item.parentElement.querySelectorAll('.subtask:not(.dragging)')];
    
    let nextSibling = siblings.find(sibling => e.clientY < sibling.getBoundingClientRect().top + sibling.offsetHeight / 2);
    
    if (nextSibling) {
      item.parentElement.insertBefore(draggingItem, nextSibling);
    } else {
      item.parentElement.appendChild(draggingItem);
    }
  });
}

document.addEventListener('input', function(event) {
  if (event.target.classList.contains('task-text') || event.target.classList.contains('subtask-text')) {
    saveToLocalStorage();
  }
});

window.onload = () => {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  
  // Restore tasks
  tasks.forEach(task => {
    addTask(task.text, task.completed, task.subtasks);
    
    const lastTask = document.querySelectorAll('.task');
    const taskElement = lastTask[lastTask.length - 1];
    const taskCheckbox = taskElement.querySelector('.task-checkbox');
    const taskText = taskElement.querySelector('.task-text');
    
    // Set task checkbox and apply strike-through if completed
    taskCheckbox.checked = task.completed;
    if (task.completed) {
      taskText.classList.add('strike-through');
    }
    
    // Process subtasks and preserve their state
    const subtaskElements = taskElement.nextElementSibling.querySelectorAll('.subtask');
    task.subtasks.forEach((sub, index) => {
      const subtaskCheckbox = subtaskElements[index].querySelector('.subtask-checkbox');
      const subtaskText = subtaskElements[index].querySelector('.subtask-text');
      
      subtaskCheckbox.checked = sub.completed;
      if (sub.completed) {
        subtaskText.classList.add('strike-through');
      }
    });
  });
  
  // Restore blockquote content
  const blockquote = document.querySelector('blockquote[contenteditable="True"]');
  const savedBlockquoteText = localStorage.getItem('blockquote');
  if (blockquote && savedBlockquoteText) {
    blockquote.innerText = savedBlockquoteText;
  }
  
  // Save blockquote changes to local storage on input
  blockquote.addEventListener('input', () => {
    localStorage.setItem('blockquote', blockquote.innerText.trim());
  });
};




function clearAllTasks() {
  taskList.innerHTML = '';
  localStorage.clear();
}