// Helpers shared by every page. Loaded after /socket.io/socket.io.js.

// Shows a status message in the given element. type: 'error' | 'success' | 'info'.
function showMessage(element, text, type) {
    if (typeof element === 'string') element = document.getElementById(element);
    if (!element) return;
    element.textContent = Array.isArray(text) ? text.join('. ') : text;
    element.className = 'message show ' + (type || 'info');
}

function hideMessage(element) {
    if (typeof element === 'string') element = document.getElementById(element);
    if (element) element.className = 'message';
}

// Appends a row of text cells (and optional DOM nodes) to a table body.
// Values are inserted as text, never as HTML, so user data cannot inject markup.
function appendRow(tbody, values) {
    const row = tbody.insertRow(-1);
    values.forEach(function (value) {
        const cell = row.insertCell(-1);
        if (value instanceof Node) {
            cell.appendChild(value);
        } else {
            cell.textContent = value == null ? '' : String(value);
        }
    });
    return row;
}

function showEmptyRow(tbody, columns, text) {
    const cell = tbody.insertRow(-1).insertCell(-1);
    cell.colSpan = columns;
    cell.className = 'empty';
    cell.textContent = text;
}

function makeButton(label, onClick, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener('click', onClick);
    return button;
}

function statusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'badge ' + status;
    badge.textContent = status;
    return badge;
}

function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(String(value).replace(' ', 'T'));
    return isNaN(date.getTime()) ? value : date.toLocaleString();
}

function setupLogout() {
    const button = document.getElementById('logoutButton');
    if (!button) return;
    button.addEventListener('click', function () {
        if (confirm('Are you sure you want to log out?')) {
            window.location.href = '/Logout';
        }
    });
}

function setupServerErrors(socket, messageElement) {
    socket.on('serverError', function (data) {
        showMessage(messageElement, data.message, 'error');
    });
    socket.on('unauthorized', function () {
        window.location.href = '/Login';
    });
}
