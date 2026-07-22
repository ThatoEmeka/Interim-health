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

// ---- Google Apps Script URL ----
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrWFg6LUd2qphDqgdNP4dqH8QWRuMX3ak_g7nILF0idzhxBGg1DXz0qiCvYCq8Q7W3lA/exec';

// ---- File Upload Handler (stores file reference for later submission) ----
let uploadedFile = null;

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        uploadedFile = file;
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

// ---- Read file as base64 ----
function readFileAsBase64(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onloadend = function() {
            // Remove the data:application/pdf;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ---- Form Submit Handler ----
function handleJoinSubmit(event) {
    event.preventDefault();
    
    // Final validation
    const popia = document.getElementById('popiaConsent');
    if (!popia.checked) {
        popia.parentElement.parentElement.classList.add('border-red-400');
        return;
    }

    // Disable the submit button to prevent double submission
    const submitBtn = event.target.querySelector('button[type=\"submit\"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    // Build the payload as a URL-encoded string (required by Google Apps Script POST)
    const params = new URLSearchParams();
    params.append('formType', 'nurse_registration');
    params.append('firstName', document.getElementById('firstName').value);
    params.append('lastName', document.getElementById('lastName').value);
    params.append('idNumber', document.getElementById('idNumber').value);
    params.append('email', document.getElementById('email').value);
    params.append('phone', document.getElementById('phone').value);
    params.append('address', document.getElementById('address').value);
    params.append('dob', document.getElementById('dob').value || '');
    params.append('qualification', document.getElementById('qualification').value);
    params.append('sancNumber', document.getElementById('sancNumber').value);
    params.append('experience', document.getElementById('experience').value);
    
    const practicing = document.querySelector('input[name=\"practicing\"]:checked');
    params.append('practicing', practicing ? practicing.value : '');
    
    params.append('availability', document.getElementById('availability').value);
    params.append('popiaConsent', popia.checked ? 'Yes' : 'No');

    // Handle CV file upload if present
    const cvFile = document.getElementById('cvUpload').files[0];
    
    function doSubmit(cvBase64, cvName) {
        if (cvBase64) {
            params.append('cvData', cvBase64);
            params.append('cvName', cvName);
        }

        // Send to Google Apps Script
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        })
        .then(function() {
            // With no-cors mode we can't read the response, so assume success
            document.getElementById('joinForm').classList.add('hidden');
            document.getElementById('joinSuccess').classList.remove('hidden');
            document.getElementById('joinSuccess').scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function() {
            alert('Something went wrong. Please email your details to help@interimhealth.co.za or try again.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Application';
            }
        });
    }

    if (cvFile) {
        readFileAsBase64(cvFile).then(function(base64) {
            doSubmit(base64, cvFile.name);
        }).catch(function() {
            // If file read fails, submit without CV
            doSubmit(null, null);
        });
    } else {
        doSubmit(null, null);
    }
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