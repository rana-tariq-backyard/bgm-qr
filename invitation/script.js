// Utility functions
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Form state management
let formData = {
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+966',
    phone: '',
    idType: '',
    idNumber: '',
    visitDate: getTodayDate(),
    consent: false
};

let errors = {};
let isLoading = false;
let showQRCode = false;
let qrImageUrl = '';
let timer = 15;
let timerInterval = null;

// Countries data
const COUNTRIES = [
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', name: 'UAE', flag: '🇦🇪' },
    { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
    { code: '+974', name: 'Qatar', flag: '🇶🇦' },
    { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
    { code: '+968', name: 'Oman', flag: '🇴🇲' },
    { code: '+1', name: 'USA', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' }
];

const ID_TYPES = ['National ID', 'Passport', 'Iqama'];

// DOM elements
const form = document.getElementById('bookingForm');
const submitButton = document.getElementById('submitButton');
const qrCodeOverlay = document.getElementById('qrCodeOverlay');
const qrCodeImage = document.getElementById('qrCodeImage');
const qrLoading = document.getElementById('qrLoading');
const qrTimer = document.getElementById('qrTimer');
const countryButton = document.getElementById('countryButton');
const countryDropdown = document.getElementById('countryDropdown');
const selectedCountryCode = document.getElementById('selectedCountryCode');
const phoneInputWrapper = document.getElementById('phoneInputWrapper');
const idTypeButton = document.getElementById('idTypeButton');
const idTypeDropdown = document.getElementById('idTypeDropdown');
const selectedIdType = document.getElementById('selectedIdType');
const idTypeSelect = document.getElementById('idType');
const idTypeSelector = idTypeButton ? idTypeButton.closest('.id-type-selector') : null;

// Utility functions
function showError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + 'Error');
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    if (inputElement) {
        inputElement.classList.add('error');
    }

    // Special handling for phone input wrapper
    if (fieldName === 'phone') {
        phoneInputWrapper.classList.add('error');
    }

    // Special handling for ID type selector
    if (fieldName === 'idType' && idTypeSelector) {
        idTypeSelector.classList.add('error');
    }
}

function clearError(fieldName) {
    const errorElement = document.getElementById(fieldName + 'Error');
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
        errorElement.classList.add('hidden');
    }

    if (inputElement) {
        inputElement.classList.remove('error');
    }

    // Special handling for phone input wrapper
    if (fieldName === 'phone') {
        phoneInputWrapper.classList.remove('error');
    }

    // Special handling for ID type selector
    if (fieldName === 'idType' && idTypeSelector) {
        idTypeSelector.classList.remove('error');
    }
}

function clearAllErrors() {
    Object.keys(errors).forEach(field => clearError(field));
    errors = {};
}

function validateForm() {
    clearAllErrors();
    const newErrors = {};
    const nameRegex = /^[a-zA-Z\s]+$/;

    // First name validation
    if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
        newErrors.firstName = 'First name must be between 2 and 50 characters';
    } else if (!nameRegex.test(formData.firstName.trim())) {
        newErrors.firstName = 'First name can only contain letters and spaces';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
        newErrors.lastName = 'Last name must be between 2 and 50 characters';
    } else if (!nameRegex.test(formData.lastName.trim())) {
        newErrors.lastName = 'Last name can only contain letters and spaces';
    }

    // Email validation
    if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phone)) {
        newErrors.phone = 'Phone number must contain only digits';
    } else if (formData.phone.length < 7 || formData.phone.length > 15) {
        newErrors.phone = 'Phone number must be between 7 and 15 digits';
    }

    // ID type validation
    if (!formData.idType) {
        newErrors.idType = 'ID type is required';
    }

    // ID number validation
    if (!formData.idNumber.trim()) {
        newErrors.idNumber = 'ID number is required';
    } else {
        const idNumber = formData.idNumber.trim();
        let isValid = false;
        let errorMessage = '';

        switch (formData.idType) {
            case 'National ID':
                isValid = /^[12]\d{9}$/.test(idNumber);
                errorMessage = 'National ID must be 10 digits starting with 1 or 2';
                break;
            case 'Iqama':
                isValid = /^[12]\d{9}$/.test(idNumber);
                errorMessage = 'Iqama number must be 10 digits starting with 1 or 2';
                break;
            case 'Passport':
                isValid = /^[A-Za-z0-9]{6,12}$/.test(idNumber);
                errorMessage = 'Passport number must be 6-12 alphanumeric characters';
                break;
            default:
                isValid = false;
                errorMessage = 'Please select an ID type first';
        }

        if (!isValid) {
            newErrors.idNumber = errorMessage;
        }
    }

    // Date validation
    if (!formData.visitDate) {
        newErrors.visitDate = 'Date of visit is required';
    } else {
        const selectedDate = new Date(formData.visitDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            newErrors.visitDate = 'Please select a future date';
        }
    }

    // Consent validation
    if (!formData.consent) {
        newErrors.consent = 'You must agree to the terms';
    }

    // Display errors
    Object.keys(newErrors).forEach(field => {
        showError(field, newErrors[field]);
    });

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
}

function resetForm() {
    formData = {
        firstName: '',
        lastName: '',
        email: '',
        countryCode: '+966',
        phone: '',
        idType: '',
        idNumber: '',
        visitDate: getTodayDate(),
        consent: false
    };

    // Reset form inputs
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('idType').value = '';
    document.getElementById('idNumber').value = '';
    document.getElementById('visitDate').value = getTodayDate();
    document.getElementById('consent').checked = false;

    // Reset country selector
    selectedCountryCode.textContent = '+966';

    // Reset ID type selector
    if (selectedIdType) {
        selectedIdType.textContent = 'Choose your ID type';
    }

    clearAllErrors();
}

function getMinDate() {
    return getTodayDate();
}

function startQRTimer() {
    timer = 10;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timer--;
        updateTimerDisplay();

        if (timer <= 0) {
            clearInterval(timerInterval);
            hideQRCode();
            resetForm();
        }
    }, 1000);
}

function updateTimerDisplay() {
    qrTimer.textContent = `This will disappear in ${timer} second${timer !== 1 ? 's' : ''}`;
}

function showQRCodeOverlay() {
    console.log('Showing QR overlay'); // Debug log

    // Show overlay
    qrCodeOverlay.classList.add('show');
    showQRCode = true;

    // Ensure loader is visible and QR image is hidden
    qrLoading.classList.remove('hidden');
    qrCodeImage.classList.add('hidden');
    qrCodeImage.src = '';
}

function hideQRCode() {
    qrCodeOverlay.classList.remove('show');
    qrCodeImage.src = '';
    qrCodeImage.classList.add('hidden');

    // Reset loader state for next use
    qrLoading.classList.remove('hidden');

    qrImageUrl = '';
    showQRCode = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function displayQRImage(url) {
    console.log('displayQRImage called with URL:', url); // Debug log
    qrImageUrl = url;

    // Set image source and wait for load
    qrCodeImage.onload = () => {
        console.log('QR image loaded successfully'); // Debug log
        // Hide loader
        qrLoading.classList.add('hidden');
        // Show QR image
        qrCodeImage.classList.remove('hidden');
    };

    qrCodeImage.onerror = () => {
        console.error('Failed to load QR image'); // Debug log
        // Still hide loader and show image (might be CORS issue but image could still display)
        qrLoading.classList.add('hidden');
        qrCodeImage.classList.remove('hidden');
    };

    qrCodeImage.src = url;
}

// Event listeners
function setupEventListeners() {
    // Set initial date to today
    document.getElementById('visitDate').value = getTodayDate();
    document.getElementById('visitDate').min = getMinDate();

    // Form input event listeners
    ['firstName', 'lastName', 'email', 'phone', 'idNumber', 'visitDate'].forEach(fieldName => {
        const element = document.getElementById(fieldName);
        if (element) {
            element.addEventListener('input', (e) => {
                formData[fieldName] = e.target.value;
                clearError(fieldName);
            });

            element.addEventListener('change', (e) => {
                formData[fieldName] = e.target.value;
                clearError(fieldName);
            });
        }
    });

    // Handle idType select change (for form submission)
    if (idTypeSelect) {
        idTypeSelect.addEventListener('change', (e) => {
            formData.idType = e.target.value;
            clearError('idType');
        });
    }

    // Consent checkbox
    document.getElementById('consent').addEventListener('change', (e) => {
        formData.consent = e.target.checked;
        clearError('consent');
    });

    // Name validation - only letters and spaces
    ['firstName', 'lastName'].forEach(fieldName => {
        const element = document.getElementById(fieldName);
        element.addEventListener('keydown', (e) => {
            if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                return;
            }
            if (!/[a-zA-Z]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });

    // Phone validation - only numbers
    document.getElementById('phone').addEventListener('keydown', (e) => {
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });

    // ID Number validation based on type
    document.getElementById('idNumber').addEventListener('keydown', (e) => {
        if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            return;
        }

        const idType = formData.idType;
        let allowedPattern = /./;

        switch (idType) {
            case 'National ID':
            case 'Iqama':
                allowedPattern = /[0-9]/;
                break;
            case 'Passport':
                allowedPattern = /[A-Za-z0-9]/;
                break;
            default:
                allowedPattern = /[A-Za-z0-9]/;
        }

        if (!allowedPattern.test(e.key)) {
            e.preventDefault();
        }
    });

    document.getElementById('idNumber').addEventListener('input', (e) => {
        const idType = formData.idType;
        let maxLength = 12;

        switch (idType) {
            case 'National ID':
            case 'Iqama':
                maxLength = 10;
                break;
            case 'Passport':
                maxLength = 12;
                break;
        }

        if (e.target.value.length > maxLength) {
            e.target.value = e.target.value.slice(0, maxLength);
            formData.idNumber = e.target.value;
        }
    });

    // Country picker functionality
    countryButton.addEventListener('click', (e) => {
        e.preventDefault();
        countryDropdown.classList.toggle('show');
    });

    // Close country picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.phone-group')) {
            countryDropdown.classList.remove('show');
        }
    });

    // Country selection
    countryDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.country-option');
        if (option) {
            const code = option.getAttribute('data-code');
            formData.countryCode = code;
            selectedCountryCode.textContent = code;
            countryDropdown.classList.remove('show');
        }
    });

    // ID Type picker functionality
    if (idTypeButton && idTypeDropdown) {
        idTypeButton.addEventListener('click', (e) => {
            e.preventDefault();
            idTypeDropdown.classList.toggle('show');
        });

        // Close ID type picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.id-type-selector')) {
                idTypeDropdown.classList.remove('show');
            }
        });

        // ID type selection
        idTypeDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.id-type-option');
            if (option) {
                const value = option.getAttribute('data-value');
                formData.idType = value;
                selectedIdType.textContent = value || 'Choose your ID type';
                idTypeSelect.value = value;
                idTypeDropdown.classList.remove('show');
                clearError('idType');
            }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const apiData = {
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
                email: formData.email.trim(),
                mobile: `${formData.countryCode}${formData.phone}`,
                id_type: formData.idType,
                id_number: formData.idNumber.trim(),
                date: formData.visitDate,
                privacy_consent: formData.consent,
            };

            const response = await fetch('https://bgm.hackyard.io/backend/api/qr/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(apiData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong. Please try again.');
            }

            const qrUrl = data.qr_image_url || data.qrImageUrl || data.url;

            if (!qrUrl) {
                throw new Error('QR code URL not found in response');
            }

            console.log('QR URL received:', qrUrl); // Debug log
            showQRCodeOverlay();
            startQRTimer();

            setTimeout(() => {
                console.log('Displaying QR image'); // Debug log
                displayQRImage(qrUrl);
            }, 100);

        } catch (error) {
            console.error('Error submitting form:', error);
            alert(error.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    });
}

function setLoading(loading) {
    isLoading = loading;

    if (loading) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <span class="loader-wrapper">
                <span class="loader"></span>
                <span>Submitting...</span>
            </span>
        `;
    } else {
        submitButton.disabled = false;
        submitButton.innerHTML = 'SUBMIT';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});