// ---- Mobile Menu Toggle ----
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('menuIcon');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>';
    } else {
        menu.classList.add('hidden');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>';
    }
}

// ---- Multi-step Form Logic ----
let currentStep = 1;
const totalSteps = 3;

function showStep(step) {
    for (let i = 1; i <= totalSteps; i++) {
        const stepEl = document.getElementById('formStep' + i);
        const dot = document.getElementById('stepDot' + i);
        stepEl.classList.remove('active');
        dot.classList.remove('active');
        
        if (i < step) {
            dot.classList.add('completed');
            dot.classList.remove('active');
        } else {
            dot.classList.remove('completed');
        }
    }
    
    const activeEl = document.getElementById('formStep' + step);
    const activeDot = document.getElementById('stepDot' + step);
    activeEl.classList.add('active');
    activeDot.classList.add('active');

    // Update connecting lines
    for (let i = 1; i < totalSteps; i++) {
        const line = document.getElementById('stepLine' + i);
        if (i < step) {
            line.classList.add('bg-brandGreen');
            line.classList.remove('bg-gray-200');
        } else {
            line.classList.remove('bg-brandGreen');
            line.classList.add('bg-gray-200');
        }
    }
}

function nextStep(current) {
    // Simple client-side validation for each step
    let valid = true;
    if (current === 1) {
        const required = ['firstName', 'lastName', 'idNumber', 'email', 'phone', 'address'];
        required.forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                el.classList.add('border-red-400');
                valid = false;
            } else {
                el.classList.remove('border-red-400');
            }
        });
    }
    if (current === 2) {
        const required = ['qualification', 'sancNumber', 'experience'];
        required.forEach(id => {
            const el = document.getElementById(id);
            if (!el.value.trim()) {
                el.classList.add('border-red-400');
                valid = false;
            } else {
                el.classList.remove('border-red-400');
            }
        });
        const practicing = document.querySelector('input[name="practicing"]:checked');
        if (!practicing) valid = false;
    }

    if (!valid) {
        // Scroll to show validation errors
        document.getElementById('formStep' + current).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    if (current < totalSteps) {
        currentStep = current + 1;
        showStep(currentStep);
        // Scroll to top of form
        document.getElementById('join-us').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function prevStep(current) {
    if (current > 1) {
        currentStep = current - 1;
        showStep(currentStep);
    }
}

// ---- File Upload Handler ----
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const nameEl = document.getElementById('fileName');
        nameEl.textContent = '✅ ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
        nameEl.classList.remove('hidden');
    }
}

// ---- Drag and Drop support for file upload ----
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.querySelector('.file-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('cvUpload').files = files;
                handleFileUpload({ target: { files: files } });
            }
        });
    }
});

// ---- Form Submit Handler ----
function handleJoinSubmit(event) {
    event.preventDefault();
    
    // Final validation
    const popia = document.getElementById('popiaConsent');
    if (!popia.checked) {
        popia.parentElement.parentElement.classList.add('border-red-400');
        return;
    }

    // Collect all form data from all 3 steps
    const formData = new FormData();
    formData.append('First Name', document.getElementById('firstName').value);
    formData.append('Last Name', document.getElementById('lastName').value);
    formData.append('ID / Passport', document.getElementById('idNumber').value);
    formData.append('Email', document.getElementById('email').value);
    formData.append('Phone', document.getElementById('phone').value);
    formData.append('Address', document.getElementById('address').value);
    formData.append('Date of Birth', document.getElementById('dob').value || 'Not provided');
    formData.append('Qualification', document.getElementById('qualification').value);
    formData.append('SANC Number', document.getElementById('sancNumber').value);
    formData.append('Experience', document.getElementById('experience').value);
    
    const practicing = document.querySelector('input[name="practicing"]:checked');
    formData.append('Currently Practicing', practicing ? practicing.value : 'Not specified');
    
    formData.append('Availability', document.getElementById('availability').value);
    formData.append('POPIA Consent', popia.checked ? 'Yes' : 'No');
    formData.append('_subject', 'New Nurse Registration - Interim Health');

    // Disable the submit button to prevent double submission
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    // Send to Formspree
    fetch('https://formspree.io/f/mykrdepn', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    })
    .then(function(response) {
        if (response.ok) {
            // Hide form, show success
            document.getElementById('joinForm').classList.add('hidden');
            document.getElementById('joinSuccess').classList.remove('hidden');
            document.getElementById('joinSuccess').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert('Something went wrong. Please email your details to help@interimhealth.co.za or try again.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            }
        }
    })
    .catch(function(error) {
        alert('Something went wrong. Please email your details to help@interimhealth.co.za or try again.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Application';
        }
    });
}

function resetJoinForm() {
    document.getElementById('joinForm').reset();
    document.getElementById('joinForm').classList.remove('hidden');
    document.getElementById('joinSuccess').classList.add('hidden');
    document.getElementById('fileName').classList.add('hidden');
    currentStep = 1;
    showStep(1);
    // Clear any error states
    document.querySelectorAll('.border-red-400').forEach(el => el.classList.remove('border-red-400'));
}

// ---- Floating CTA Banner ----
document.addEventListener('DOMContentLoaded', function() {
    const floatingCta = document.getElementById('floatingCta');
    let lastScrollY = window.scrollY;
    let hasBeenVisible = false;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        const scrollPercent = currentScrollY / (docHeight - windowHeight) * 100;

        // Show after scrolling past 30% of the page
        if (scrollPercent > 30 && !hasBeenVisible) {
            floatingCta.classList.remove('hidden-banner');
            floatingCta.classList.add('visible');
            hasBeenVisible = true;
        }

        // Hide when at the very bottom (footer area) or at the top
        if (docHeight - currentScrollY - windowHeight < 100 || currentScrollY < 50) {
            floatingCta.classList.add('hidden-banner');
            floatingCta.classList.remove('visible');
        } else if (hasBeenVisible && scrollPercent > 30) {
            floatingCta.classList.remove('hidden-banner');
            floatingCta.classList.add('visible');
        }

        lastScrollY = currentScrollY;
    });
});

// ---- Smooth Scroll Reveal Animations ----
document.addEventListener('DOMContentLoaded', function() {
    const revealElements = document.querySelectorAll('.reveal');
    const staggerElements = document.querySelectorAll('.stagger-children');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => observer.observe(el));
    staggerElements.forEach(el => observer.observe(el));
});

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
});