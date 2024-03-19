document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    // Form submission
    document.getElementById('contactForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission

        // Get form data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const purpose = document.querySelector('input[name="messageType"]:checked').value;

        // SweetAlert2 for form submission
        Swal.fire({
            title: 'Success!',
            text: 'Your message has been submitted.',
            icon: 'success',
            confirmButtonText: 'OK'
        }).then(() => {
            // Reset form fields after successful submission
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('message').value = '';
        });
    });
});
