function validateForm() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;


    //perform server-side validation here
    fetch(`http://localhost:3000/voters?voter_id=${username}`)
    .then(response => response.json())
    .then(data => { 
        //const dbpassword = ${data.password};
        
    })
    .catch(error => console.error('Error:', error));


    if (username === "admin" && password === "password") {
        
        alert('Login successful! Redirecting...');
        //redirect to a new page after successful login
        window.location.href = "dashboard.html"; // Replace with the actual dashboard URL
        return false; // Prevent form submission 
    } else {
        document.getElementById('error-msg').textContent = "Invalid username or password. Please try again.";
        return false;
    }
}
