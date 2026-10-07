const socket = io();
const requestForm = document.getElementById('request-form');
const message = document.getElementById('request-message');
setupServerErrors(socket, message);

// Mirrors the server-side checks so most mistakes are caught before submitting.
function validate(data) {
    const errors = [];
    if (!data.first || !data.last || !data.address || !data.city || !data.id) {
        errors.push('Please fill in every field');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Please enter a valid email address');
    if (!/^\d{5}$/.test(data.zipCode)) errors.push('Zip code must be 5 digits');
    const age = parseInt(data.age, 10);
    if (!(age >= 18 && age <= 130)) errors.push('You must be at least 18 years old to register');
    return errors;
}

requestForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const data = {
        first: requestForm.firstName.value.trim(),
        last: requestForm.lastName.value.trim(),
        age: requestForm.age.value.trim(),
        address: requestForm.address.value.trim(),
        city: requestForm.city.value.trim(),
        zipCode: requestForm.zipCode.value.trim(),
        id: requestForm.idNo.value.trim(),
        email: requestForm.email.value.trim(),
    };
    const errors = validate(data);
    if (errors.length) {
        showMessage(message, errors, 'error');
        return;
    }
    socket.emit('request', data);
});

socket.on('validation', function (data) {
    if (data.valid === '1') {
        requestForm.reset();
        showMessage(message, 'Request submitted! You will receive an email once an administrator approves it.', 'success');
    } else {
        showMessage(message, data.errors || 'Invalid request.', 'error');
    }
});
