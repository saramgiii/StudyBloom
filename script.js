// ========================================
// StudyBloom - Student Task Manager
// ========================================

// Get HTML elements
const taskForm = document.getElementById("task-form");

const titleInput = document.getElementById("task-title");
const categoryInput = document.getElementById("task-category");
const priorityInput = document.getElementById("task-priority");
const dateInput = document.getElementById("task-date");
const subjectInput = document.getElementById("task-subject");
const descriptionInput = document.getElementById("task-description");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("task-search");

const totalTasksElement = document.getElementById("total-tasks");
const pendingTasksElement = document.getElementById("pending-tasks");
const completedTasksElement = document.getElementById("completed-tasks");

const progressMessage = document.getElementById("progress-message");
const progressPercentage = document.getElementById("progress-percentage");
const progressFill = document.getElementById("progress-fill");

const currentDateElement = document.getElementById("current-date");

// Load saved tasks from the browser
let tasks = loadTasks();

// The selected filter
let currentFilter = "all";

// ========================================
// Load saved tasks safely
// ========================================

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("studyBloomTasks");

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        // Keep only valid task objects
        return parsedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Unable to load saved tasks:", error);
        return [];
    }
}

// ========================================
// Save tasks in browser storage
// ========================================

function saveTasks() {
    try {
        localStorage.setItem("studyBloomTasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);

        alert(
            "Your tasks could not be saved in this browser. " +
            "Please check your browser storage settings."
        );

        return false;
    }
}

// ========================================
// Display the current date
// ========================================

function displayCurrentDate() {
    if (!currentDateElement) return;

    const today = new Date();

    currentDateElement.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// ========================================
// Create a unique task ID
// ========================================

function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString() + Math.random().toString(36).slice(2);
}

// ========================================
// Add a new task
// ========================================

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();

    if (!title) {
        alert("Please enter a task title.");
        titleInput.focus();
        return;
    }

    const newTask = {
        id: createTaskId(),
        title: title,
        category: categoryInput.value,
        priority: priorityInput.value,
        dueDate: dateInput.value,
        subject: subjectInput.value.trim(),
        description: descriptionInput.value.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };

    // Add the new task to the beginning of the list
    tasks.unshift(newTask);

    if (!saveTasks()) {
        tasks.shift();
        return;
    }

    // Show the newly added task
    currentFilter = "all";
    updateFilterButtons();

    searchInput.value = "";

    renderTasks();
    updateDashboard();

    // Clear the form
    taskForm.reset();

    // Show the task list
    document.getElementById("tasks").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// ========================================
// Mark a task as completed or pending
// ========================================

function toggleTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = !task.completed;
        return;
    }

    renderTasks();
    updateDashboard();
}

// ========================================
// Delete a task
// ========================================

function deleteTask(taskId) {
    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    const shouldDelete = confirm(
        'Are you sure you want to delete "' + task.title + '"?'
    );

    if (!shouldDelete) return;

    const previousTasks = [...tasks];

    tasks = tasks.filter(item => item.id !== taskId);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    renderTasks();
    updateDashboard();
}

// ========================================
// Safely display text entered by the user
// ========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

// ========================================
// Format the due date
// ========================================

function formatDueDate(dateString) {
    if (!dateString) {
        return "No due date";
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return "No due date";
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "No due date";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// ========================================
// Check whether a task is overdue
// ========================================

function isOverdue(task) {
    if (!task.dueDate || task.completed) {
        return false;
    }

    const today = new Date();

    const todayString =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    return task.dueDate < todayString;
}

// ========================================
// Display tasks on the website
// ========================================

function renderTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    // Apply search
    let filteredTasks = tasks.filter(task => {
        const searchableText = [
            task.title,
            task.category,
            task.priority,
            task.subject,
            task.description
        ].join(" ").toLowerCase();

        return searchableText.includes(searchTerm);
    });

    // Apply the selected filter
    if (currentFilter === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    // Sort pending tasks by due date; tasks without dates go last
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        if (a.dueDate && b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate);
        }

        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        return 0;
    });

    // Clear the previous task cards
    taskList.replaceChildren();

    // Show an empty message if no tasks match
    if (filteredTasks.length === 0) {
        emptyState.classList.remove("hidden");

        const emptyHeading = emptyState.querySelector("h3");
        const emptyParagraph = emptyState.querySelector("p");

        if (searchTerm) {
            emptyHeading.textContent = "No matching tasks";
            emptyParagraph.textContent =
                "Try a different search term.";
        } else if (currentFilter === "completed") {
            emptyHeading.textContent = "No completed tasks yet";
            emptyParagraph.textContent =
                "Complete a task and it will appear here.";
        } else if (currentFilter === "pending") {
            emptyHeading.textContent = "All caught up!";
            emptyParagraph.textContent =
                "You have no pending tasks. Enjoy your progress!";
        } else {
            emptyHeading.textContent = "No tasks yet";
            emptyParagraph.textContent =
                "Add your first task above and start planning your day.";
        }

        return;
    }

    emptyState.classList.add("hidden");

    // Create a card for each task
    filteredTasks.forEach(task => {
        const card = document.createElement("article");

        card.className = "task-card";

        if (task.completed) {
            card.classList.add("task-completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            "Mark " + task.title + " as completed"
        );

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });

        const content = document.createElement("div");

        content.className = "task-content";

        const title = document.createElement("h3");

        title.className = "task-title";
        title.textContent = task.title;

        content.appendChild(title);

        if (task.description) {
            const description = document.createElement("p");

            description.className = "task-description";
            description.textContent = task.description;

            content.appendChild(description);
        }

        const meta = document.createElement("div");

        meta.className = "task-meta";

        // Category
        const categoryTag = document.createElement("span");

        categoryTag.className = "task-tag category-tag";
        categoryTag.textContent = task.category || "Personal";

        meta.appendChild(categoryTag);

        // Priority
        const priorityTag = document.createElement("span");

        priorityTag.className = "task-tag priority-" +
            String(task.priority || "medium").toLowerCase();

        priorityTag.textContent =
            (task.priority || "Medium") + " Priority";

        meta.appendChild(priorityTag);

        // Subject
        if (task.subject) {
            const subjectTag = document.createElement("span");

            subjectTag.className = "task-tag";
            subjectTag.textContent = task.subject;

            meta.appendChild(subjectTag);
        }

        // Due date
        const dueDate = document.createElement("span");

        dueDate.className = "task-date";

        if (isOverdue(task)) {
            dueDate.classList.add("overdue");
            dueDate.textContent =
                "Overdue · " + formatDueDate(task.dueDate);
        } else {
            dueDate.textContent = "Due: " + formatDueDate(task.dueDate);
        }

        meta.appendChild(dueDate);

        content.appendChild(meta);

        // Delete button
        const actions = document.createElement("div");

        actions.className = "task-actions";

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "✕";
        deleteButton.setAttribute(
            "aria-label",
            "Delete " + task.title
        );
        deleteButton.title = "Delete task";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });

        actions.appendChild(deleteButton);

        card.appendChild(checkbox);
        card.appendChild(content);
        card.appendChild(actions);

        taskList.appendChild(card);
    });
}

// ========================================
// Update dashboard counts and progress
// ========================================

function updateDashboard() {
    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasksElement.textContent = total;
    pendingTasksElement.textContent = pending;
    completedTasksElement.textContent = completed;

    progressPercentage.textContent = percentage + "%";

    progressFill.style.width = percentage + "%";

    progressFill.setAttribute("aria-valuenow", percentage);

    if (total === 0) {
        progressMessage.textContent =
            "Your study journey starts with one small step. 🌱";
    } else if (percentage === 100) {
        progressMessage.textContent =
            "Amazing! You completed all your tasks. Keep blooming! 🌸";
    } else if (percentage >= 50) {
        progressMessage.textContent =
            "You're making great progress. Keep going! 🌿";
    } else {
        progressMessage.textContent =
            "Every small step counts. Keep moving forward! 💗";
    }
}

// ========================================
// Filter buttons
// ========================================

function updateFilterButtons() {
    const filterButtons = document.querySelectorAll(".filter-btn");

    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);

        button.setAttribute("aria-pressed", String(isActive));
    });
}

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", function () {
        currentFilter = this.dataset.filter;

        updateFilterButtons();
        renderTasks();
    });
});

// ========================================
// Search tasks
// ========================================

searchInput.addEventListener("input", function () {
    renderTasks();
});

// ========================================
// Sidebar navigation
// ========================================

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function () {
        document.querySelectorAll(".nav-link").forEach(navLink => {
            navLink.classList.remove("active");
        });

        this.classList.add("active");
    });
});

// ========================================
// Start the application
// ========================================

displayCurrentDate();
updateFilterButtons();
renderTasks();
updateDashboard();

// ========================================
// StudyBloom - Class Timetable
// ========================================

// Get timetable form elements
const timetableForm = document.getElementById("timetable-form");
const timetableList = document.getElementById("timetable-list");
const timetableEmpty = document.getElementById("timetable-empty");

const classDayInput = document.getElementById("class-day");
const classSubjectInput = document.getElementById("class-subject");
const classStartInput = document.getElementById("class-start");
const classEndInput = document.getElementById("class-end");
const classRoomInput = document.getElementById("class-room");

// Load saved classes
function loadClasses() {
    try {
        const savedClasses = localStorage.getItem("studyBloomClasses");
        const parsedClasses = savedClasses ? JSON.parse(savedClasses) : [];

        return Array.isArray(parsedClasses) ? parsedClasses : [];
    } catch (error) {
        console.error("Unable to load classes:", error);
        return [];
    }
}

let classes = loadClasses();

// Save classes
function saveClasses() {
    try {
        localStorage.setItem("studyBloomClasses", JSON.stringify(classes));
        return true;
    } catch (error) {
        alert("Unable to save your timetable. Please check browser storage.");
        return false;
    }
}

// Format time
function formatClassTime(time) {
    if (!time) return "";

    const parts = time.split(":");
    let hours = Number(parts[0]);
    const minutes = parts[1];

    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return hours + ":" + minutes + " " + period;
}

// Add a class
if (timetableForm) {
    timetableForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const subject = classSubjectInput.value.trim();
        const start = classStartInput.value;
        const end = classEndInput.value;

        if (!subject || !start || !end) {
            alert("Please fill in the subject and class times.");
            return;
        }

        if (end <= start) {
            alert("The end time must be later than the start time.");
            classEndInput.focus();
            return;
        }

        const newClass = {
            id: createTaskId(),
            day: classDayInput.value,
            subject: subject,
            start: start,
            end: end,
            room: classRoomInput.value.trim()
        };

        classes.push(newClass);

        if (!saveClasses()) {
            classes.pop();
            return;
        }

        renderClasses();
        timetableForm.reset();
    });
}

// Delete a class
function deleteClass(classId) {
    const selectedClass = classes.find(item => item.id === classId);

    if (!selectedClass) return;

    if (!confirm("Delete the class " + selectedClass.subject + "?")) {
        return;
    }

    const previousClasses = [...classes];

    classes = classes.filter(item => item.id !== classId);

    if (!saveClasses()) {
        classes = previousClasses;
        return;
    }

    renderClasses();
}

// Display classes
// Display classes in a weekly calendar
function renderClasses() {
    if (!timetableList || !timetableEmpty) return;

    timetableList.replaceChildren();

    const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    const sortedClasses = [...classes]
        .filter(item =>
            dayOrder.includes(item.day) &&
            item.start &&
            item.end
        )
        .sort((a, b) => {
            const dayDifference =
                dayOrder.indexOf(a.day) -
                dayOrder.indexOf(b.day);

            if (dayDifference !== 0) {
                return dayDifference;
            }

            return a.start.localeCompare(b.start);
        });

    // Show the empty message when no classes exist
    timetableEmpty.classList.toggle(
        "hidden",
        sortedClasses.length > 0
    );

    if (sortedClasses.length === 0) return;

    // Find the earliest start and latest end time
    const toMinutes = time => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const earliest = Math.min(
        ...sortedClasses.map(item =>
            Math.floor(toMinutes(item.start) / 60) * 60
        )
    );

    const latest = Math.max(
        ...sortedClasses.map(item =>
            Math.ceil(toMinutes(item.end) / 60) * 60
        )
    );

    const startHour = Math.floor(earliest / 60);
    const endHour = Math.max(
        startHour + 1,
        Math.ceil(latest / 60)
    );

    const totalSlots = (endHour - startHour) * 2;

    // Create the calendar grid
    timetableList.style.gridTemplateColumns =
        "75px repeat(6, minmax(110px, 1fr))";

    timetableList.style.gridTemplateRows =
        `auto repeat(${totalSlots}, 36px)`;

    timetableList.style.minWidth = "735px";
    timetableList.style.position = "relative";

    // Add day headings
    dayOrder.forEach((day, index) => {
        const heading = document.createElement("div");

        heading.className = "timetable-day-heading";
        heading.textContent = day;
        heading.style.gridColumn = String(index + 2);
        heading.style.gridRow = "1";

        timetableList.appendChild(heading);
    });

    // Add time labels and calendar background slots
    for (let slot = 0; slot < totalSlots; slot++) {
        const minutes = startHour * 60 + slot * 30;

        // Show a time label every hour
        if (slot % 2 === 0) {
            const timeLabel = document.createElement("div");

            timeLabel.className = "timetable-time";
            timeLabel.textContent = formatClassTime(
                `${String(Math.floor(minutes / 60)).padStart(2, "0")}:00`
            );

            timeLabel.style.gridColumn = "1";
            timeLabel.style.gridRow = `${slot + 2} / span 2`;

            timetableList.appendChild(timeLabel);
        }

        // Create a background cell for every day and time slot
        dayOrder.forEach((day, index) => {
            const cell = document.createElement("div");

            cell.className = "timetable-slot";
            cell.style.gridColumn = String(index + 2);
            cell.style.gridRow = String(slot + 2);

            timetableList.appendChild(cell);
        });
    }

    // Add each class to its correct day and time
    sortedClasses.forEach(item => {
        const classCard = document.createElement("article");

        classCard.className = "timetable-class";

        const startMinutes = toMinutes(item.start);
        const endMinutes = toMinutes(item.end);

        const startSlot = Math.floor(
            (startMinutes - startHour * 60) / 30
        );

        const durationSlots = Math.max(
            1,
            Math.ceil((endMinutes - startMinutes) / 30)
        );

        classCard.style.gridColumn =
            String(dayOrder.indexOf(item.day) + 2);

        classCard.style.gridRow =
            `${startSlot + 2} / span ${durationSlots}`;

        const title = document.createElement("strong");
        title.textContent = item.subject;

        const time = document.createElement("p");
        time.textContent =
            `${formatClassTime(item.start)} – ${formatClassTime(item.end)}`;

        classCard.appendChild(title);
        classCard.appendChild(time);

        if (item.room) {
            const room = document.createElement("p");
            room.textContent = "📍 " + item.room;
            classCard.appendChild(room);
        }

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.title = "Delete class";
        deleteButton.setAttribute(
            "aria-label",
            "Delete " + item.subject
        );

        deleteButton.addEventListener("click", function () {
            deleteClass(item.id);
        });

        classCard.appendChild(deleteButton);
        timetableList.appendChild(classCard);
    });
}

// Display saved classes when the page opens
renderClasses();
// ========================================
// Study Plan
// ========================================

const studyForm = document.getElementById("study-form");
const studyList = document.getElementById("study-list");
const studyEmpty = document.getElementById("study-empty");

let studyTopics = JSON.parse(
    localStorage.getItem("studyBloomStudyTopics") || "[]"
);

function saveStudy() {
    localStorage.setItem("studyBloomStudyTopics", JSON.stringify(studyTopics));
}

function renderStudy() {
    if (!studyList || !studyEmpty) return;

    studyList.replaceChildren();
    studyEmpty.classList.toggle("hidden", studyTopics.length > 0);

    studyTopics.forEach((item, i) => {
        const card = document.createElement("article");
        card.className = "task-card";

        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = item.topic;

        const info = document.createElement("p");
        info.textContent = item.subject + " · " +
            (item.date ? formatDueDate(item.date) : "No date") +
            (item.completed ? " · Completed" : " · Pending");

        content.append(title, info);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const done = document.createElement("button");
        done.className = "secondary-btn";
        done.textContent = item.completed ? "Undo" : "Complete";
        done.onclick = () => {
            studyTopics[i].completed = !studyTopics[i].completed;
            saveStudy();
            renderStudy();
            renderCalendar();
        };

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "✕";
        del.onclick = () => {
            if (confirm("Delete this study topic?")) {
                studyTopics.splice(i, 1);
                saveStudy();
                renderStudy();
                renderCalendar();
            }
        };

        actions.append(done, del);
        card.append(content, actions);
        studyList.appendChild(card);
    });
}

studyForm?.addEventListener("submit", e => {
    e.preventDefault();

    const subject = document.getElementById("study-subject").value.trim();
    const topic = document.getElementById("study-topic").value.trim();
    const date = document.getElementById("study-date").value;

    if (!subject || !topic) {
        alert("Enter a subject and topic.");
        return;
    }

    studyTopics.push({ subject, topic, date, completed: false });
    saveStudy();
    renderStudy();
    renderCalendar();
    studyForm.reset();
});


// ========================================
// Exam Planner
// ========================================

const examForm = document.getElementById("exam-form");
const examList = document.getElementById("exam-list");
const examEmpty = document.getElementById("exam-empty");

let exams = JSON.parse(
    localStorage.getItem("studyBloomExams") || "[]"
);

function saveExams() {
    localStorage.setItem("studyBloomExams", JSON.stringify(exams));
}

function renderExams() {
    if (!examList || !examEmpty) return;

    examList.replaceChildren();
    examEmpty.classList.toggle("hidden", exams.length > 0);

    exams.forEach((exam, i) => {
        const card = document.createElement("article");
        card.className = "task-card";

        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = exam.subject;

        const date = document.createElement("p");
        date.textContent = "Exam date: " + formatDueDate(exam.date);

        const label = document.createElement("label");
        label.textContent = "Preparation status: ";

        const status = document.createElement("select");
        status.className = "exam-status-select";

        ["Not Started", "In Progress", "Prepared"].forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            status.appendChild(option);
        });

        status.value = exam.status || "Not Started";

        status.onchange = () => {
            exams[i].status = status.value;
            saveExams();
            renderCalendar();
        };

        label.appendChild(status);
        content.append(title, date, label);

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "✕";
        del.onclick = () => {
            if (confirm("Delete this exam?")) {
                exams.splice(i, 1);
                saveExams();
                renderExams();
                renderCalendar();
            }
        };

        const actions = document.createElement("div");
        actions.className = "task-actions";
        actions.appendChild(del);

        card.append(content, actions);
        examList.appendChild(card);
    });
}

examForm?.addEventListener("submit", e => {
    e.preventDefault();

    const subject = document.getElementById("exam-subject").value.trim();
    const date = document.getElementById("exam-date").value;
    const status = document.getElementById("exam-status").value;

    if (!subject || !date) {
        alert("Enter the exam subject and date.");
        return;
    }

    exams.push({ subject, date, status });
    saveExams();
    renderExams();
    renderCalendar();
    examForm.reset();
});


// ========================================
// Calendar
// ========================================

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonth = document.getElementById("calendar-month");
const selectedHeading = document.getElementById("selected-date-heading");
const calendarEvents = document.getElementById("calendar-events");
const calendarEmpty = document.getElementById("calendar-empty");

let viewDate = new Date();
let selectedDate = localDate(new Date());

function localDate(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}

function eventsFor(date) {
    return [
        ...tasks.filter(t => t.dueDate === date)
            .map(t => ({ title: t.title, type: "Task" })),

        ...studyTopics.filter(t => t.date === date)
            .map(t => ({ title: t.topic, type: "Study" })),

        ...exams.filter(t => t.date === date)
            .map(t => ({ title: t.subject, type: "Exam" }))
    ];
}

function renderCalendar() {
    if (!calendarGrid || !calendarMonth) return;

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    calendarMonth.textContent = viewDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    calendarGrid.replaceChildren();

    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
        const heading = document.createElement("div");
        heading.className = "calendar-day-name";
        heading.textContent = day;
        calendarGrid.appendChild(heading);
    });

    const offset = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < offset; i++) {
        const blank = document.createElement("div");
        blank.className = "calendar-day empty";
        calendarGrid.appendChild(blank);
    }

    for (let day = 1; day <= totalDays; day++) {
        const date = localDate(new Date(year, month, day));
        const button = document.createElement("button");
        button.className = "calendar-day";
        button.textContent = day;
        button.type = "button";

        if (date === selectedDate) button.classList.add("selected");
        if (date === localDate(new Date())) button.classList.add("today");
        if (eventsFor(date).length) button.classList.add("has-events");

        button.onclick = () => {
            selectedDate = date;
            renderCalendar();
        };

        calendarGrid.appendChild(button);
    }

    renderCalendarEvents();
}

function renderCalendarEvents() {
    if (!calendarEvents || !calendarEmpty || !selectedHeading) return;

    selectedHeading.textContent = formatDueDate(selectedDate);
    calendarEvents.replaceChildren();

    const events = eventsFor(selectedDate);
    calendarEmpty.classList.toggle("hidden", events.length > 0);

    events.forEach(event => {
        const card = document.createElement("article");
        card.className = "task-card";

        const text = document.createElement("div");
        text.className = "task-content";
        text.textContent = event.type + ": " + event.title;

        card.appendChild(text);
        calendarEvents.appendChild(card);
    });
}

document.getElementById("previous-month")?.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById("next-month")?.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
});

// Show saved information when the page opens
renderStudy();
renderExams();
renderCalendar();
