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

// ---- Submit via hidden iframe (most reliable for Google Apps Script) ----
function submitViaIframe(url, params, onSuccess, onError) {
    // Create a unique iframe name
    var iframeName = 'hidden_iframe_' + Date.now();
    
    // Create a hidden iframe
    var iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Create a hidden form that targets the iframe
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = iframeName;
    form.style.display = 'none';
    
    // Add all params as hidden inputs
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = params[key];
            form.appendChild(input);
        }
    }
    
    document.body.appendChild(form);
    
    // Set a timeout to detect if submission worked
    var timeout = setTimeout(function() {
        // If iframe hasn't loaded in 10 seconds, assume it worked
        // (Google Apps Script often doesn't trigger iframe onload)
        cleanup();
        if (onSuccess) onSuccess();
    }, 10000);
    
    function cleanup() {
        clearTimeout(timeout);
        setTimeout(function() {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            if (form.parentNode) form.parentNode.removeChild(form);
        }, 1000);
    }
    
    // Try to detect iframe load (may not fire with Google Apps Script)
    iframe.onload = function() {
        cleanup();
        if (onSuccess) onSuccess();
    };
    
    // Submit the form
    form.submit();
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
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    // Build the payload as a plain object
    var params = {};
    params.formType = 'nurse_registration';
    params.firstName = document.getElementById('firstName').value;
    params.lastName = document.getElementById('lastName').value;
    params.idNumber = document.getElementById('idNumber').value;
    params.email = document.getElementById('email').value;
    params.phone = document.getElementById('phone').value;
    params.address = document.getElementById('address').value;
    params.dob = document.getElementById('dob').value || '';
    params.qualification = document.getElementById('qualification').value;
    params.sancNumber = document.getElementById('sancNumber').value;
    params.experience = document.getElementById('experience').value;
    
    var practicing = document.querySelector('input[name="practicing"]:checked');
    params.practicing = practicing ? practicing.value : '';
    
    params.availability = document.getElementById('availability').value;
    params.popiaConsent = popia.checked ? 'Yes' : 'No';

    // Handle CV file upload if present
    const cvFile = document.getElementById('cvUpload').files[0];
    
    function doSubmit() {
        // Submit via hidden iframe (most reliable method)
        submitViaIframe(
            GOOGLE_SCRIPT_URL,
            params,
            function() {
                // Success
                document.getElementById('joinForm').classList.add('hidden');
                document.getElementById('joinSuccess').classList.remove('hidden');
                document.getElementById('joinSuccess').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        );
    }

    if (cvFile) {
        readFileAsBase64(cvFile).then(function(base64) {
            params.cvData = base64;
            params.cvName = cvFile.name;
            doSubmit();
        }).catch(function() {
            // If file read fails, submit without CV
            doSubmit();
        });
    } else {
        doSubmit();
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

// ---- Contact Form Submit Handler ----
function handleContactSubmit(form) {
    var params = {};
    params.formType = 'contact';
    params.firstName = form.querySelector('[name="firstName"]').value;
    params.lastName = form.querySelector('[name="lastName"]').value;
    params.email = form.querySelector('[name="email"]').value;
    params.inquiryType = form.querySelector('[name="inquiryType"]').value;
    params.message = form.querySelector('[name="message"]').value;
    
    // Disable button
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending...';
    }
    
    submitViaIframe(
        GOOGLE_SCRIPT_URL,
        params,
        function() {
            form.innerHTML = '<div class="flex flex-col items-center justify-center h-full min-h-[300px] text-center"><div class="w-16 h-16 bg-brandGreen text-white rounded-full flex items-center justify-center mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></div><h3 class="text-2xl font-bold text-brandPurple mb-2">Message Sent!</h3><p class="text-gray-600">Thank you for reaching out. A member of the Interim Health team will contact you shortly.</p></div>';
        }
    );
    
    return false;
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
});
