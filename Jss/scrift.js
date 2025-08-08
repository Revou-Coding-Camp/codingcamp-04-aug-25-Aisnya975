document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const taskInput = document.getElementById("taskinput");
  const dateInput = document.getElementById("dateinput");
  const addButton = document.getElementById("addbutton");
  const taskList = document.getElementById("task-list");
  const searchInput = document.getElementById("search-input");
  const deleteAllBtn = document.getElementById("btn-delete");

  const totalTasksEl = document.getElementById("tasks-total");
  const pendingTotalEl = document.getElementById("pending-total");
  const completedTotalEl = document.getElementById("completed-total");
  const progressTotalEl = document.getElementById("progress-total");

  const btnFilter = document.getElementById('btn-filter');
  const filterOptions = document.getElementById('filter-options');
  const btnSort = document.getElementById('btn-sort');
  const sortOptions = document.getElementById('sort-options');

  
  let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  let filter = 'all';   
  let sortBy = null;    

 
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d + 'T00:00:00'); 
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString();
  }

  function renderTasks() {
  
    let list = tasks.slice();

    if (filter === 'pending') list = list.filter(t => !t.completed);
    else if (filter === 'completed') list = list.filter(t => t.completed);

    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q) list = list.filter(t => t.name.toLowerCase().includes(q));

    if (sortBy === 'name') {
      list.sort((a,b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'date') {
      list.sort((a,b) => {
        const ta = a.date ? new Date(a.date).getTime() : Infinity;
        const tb = b.date ? new Date(b.date).getTime() : Infinity;
        return (ta - tb);
      });
    }

    taskList.innerHTML = '';
    if (list.length === 0) {
      taskList.innerHTML = `<tr><td colspan="4" style="text-align:center">No Tasks Found</td></tr>`;
    } else {
      list.forEach(task => {
        const tr = document.createElement('tr');
        tr.dataset.id = task.id;

        const tdName = document.createElement('td');
        tdName.textContent = task.name;
        if (task.completed) tdName.style.textDecoration = 'line-through';

        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(task.date);

        const tdStatus = document.createElement('td');
        const span = document.createElement('span');
        span.className = task.completed ? 'status-completed' : 'status-pending';
        span.textContent = task.completed ? 'Completed' : 'Pending';
        tdStatus.appendChild(span);

        const tdAction = document.createElement('td');

        const btnComplete = document.createElement('button');
        btnComplete.type = 'button';
        btnComplete.className = 'action-btn action-complete';
        btnComplete.title = 'Toggle Complete';
        btnComplete.innerText = '✔';

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'action-btn action-edit';
        btnEdit.title = 'Edit';
        btnEdit.innerText = '✏';

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'action-btn action-delete';
        btnDelete.title = 'Delete';
        btnDelete.innerText = '🗑';

        tdAction.appendChild(btnComplete);
        tdAction.appendChild(btnEdit);
        tdAction.appendChild(btnDelete);

        tr.appendChild(tdName);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);
        tr.appendChild(tdAction);

        taskList.appendChild(tr);
      });
    }

    updateStats();
  }

  function addTask() {
    const name = (taskInput.value || '').trim();
    const date = (dateInput.value || '').trim();
    if (!name) {
      alert('Please enter a task name.');
      taskInput.focus();
      return;
    }
    const newTask = { id: uid(), name, date: date || '', completed: false };
    tasks.push(newTask);
    saveTasks();
    taskInput.value = '';
    dateInput.value = '';
    renderTasks();
  }
 
  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (totalTasksEl) totalTasksEl.textContent = String(total);
    if (pendingTotalEl) pendingTotalEl.textContent = String(pending);
    if (completedTotalEl) completedTotalEl.textContent = String(completed);
    if (progressTotalEl) progressTotalEl.textContent = percent + '%';
  }

  taskList?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const tr = btn.closest('tr');
    if (!tr) return;
    const id = tr.dataset.id;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;

    if (btn.classList.contains('action-delete')) {
      if (confirm('Delete this task?')) {
        tasks.splice(idx, 1);
        saveTasks();
        renderTasks();
      }
      return;
    }

    if (btn.classList.contains('action-complete')) {
      tasks[idx].completed = !tasks[idx].completed;
      saveTasks();
      renderTasks();
      return;
    }

    if (btn.classList.contains('action-edit')) {
      const newName = prompt('Edit task name:', tasks[idx].name);
      if (newName !== null) {
        const trimmed = newName.trim();
        if (trimmed) {
          tasks[idx].name = trimmed;
          saveTasks();
          renderTasks();
        }
      }
      return;
    }
  });

  addButton?.addEventListener('click', addTask);
  taskInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

  deleteAllBtn?.addEventListener('click', () => {
    if (!tasks.length) {
      alert('No tasks to delete.');
      return;
    }
    if (confirm('Delete ALL tasks? This cannot be undone.')) {
      tasks = [];
      saveTasks();
      renderTasks();
    }
  });

  searchInput?.addEventListener('input', () => renderTasks());

  window.filterStatus = function(status) {
    filter = (status || 'all').toString().toLowerCase();
    if (filterOptions) filterOptions.style.display = 'none';
    renderTasks();
  };

  window.sortTasks = function(type) {
    sortBy = type || null;
    if (sortOptions) sortOptions.style.display = 'none';
    if (sortBy === 'name' || sortBy === 'date') {
      saveTasks(); 
    }
    renderTasks();
  };

  if (btnFilter && filterOptions) {
    btnFilter.addEventListener('click', (e) => {
      e.stopPropagation();
      filterOptions.style.display = (getComputedStyle(filterOptions).display === 'block') ? 'none' : 'block';
      if (sortOptions) sortOptions.style.display = 'none';
    });
    filterOptions.addEventListener('click', (e) => e.stopPropagation());
  }

  if (btnSort && sortOptions) {
    btnSort.addEventListener('click', (e) => {
      e.stopPropagation();
      sortOptions.style.display = (getComputedStyle(sortOptions).display === 'block') ? 'none' : 'block';
      if (filterOptions) filterOptions.style.display = 'none';
    });
    sortOptions.addEventListener('click', (e) => e.stopPropagation());
  }

  document.addEventListener('click', () => {
    if (filterOptions) filterOptions.style.display = 'none';
    if (sortOptions) sortOptions.style.display = 'none';
  });

  renderTasks();
});
