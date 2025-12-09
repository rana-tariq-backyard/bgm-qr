import { useState, useEffect, useCallback } from 'react'
import './App.css'

// Selected countries for the picker
const COUNTRIES = [
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
]

const ID_TYPES = [
  'National ID',
  'Passport',
  'Iqama',
]

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+966',
    phone: '',
    idType: '',
    idNumber: '',
    visitDate: new Date().toISOString().split('T')[0],
    consent: false,
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [timer, setTimer] = useState(15) // 15 seconds countdown

  // Close country picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCountryPicker && !event.target.closest('.phone-group')) {
        setShowCountryPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCountryPicker])

  // Reset form function
  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      countryCode: '+966',
      phone: '',
      idType: '',
      idNumber: '',
      visitDate: new Date().toISOString().split('T')[0],
      consent: false,
    })
    setErrors({})
  }, [])

  // Countdown timer for QR code
  useEffect(() => {
    if (showQRCode && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(interval)
            setShowQRCode(false)
            setQrImageUrl('')
            resetForm()
            return 15 // Reset timer for next use
          }
          return prevTimer - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [showQRCode, timer, resetForm])

  const validateForm = () => {
    const newErrors = {}
    const nameRegex = /^[a-zA-Z\s]+$/

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name must be between 2 and 50 characters'
    } else if (!nameRegex.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters and spaces'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name must be between 2 and 50 characters'
    } else if (!nameRegex.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters and spaces'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must contain only digits'
    } else if (formData.phone.length < 7 || formData.phone.length > 15) {
      newErrors.phone = 'Phone number must be between 7 and 15 digits'
    }

    if (!formData.idType) {
      newErrors.idType = 'ID type is required'
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'ID number is required'
    } else {
      const idNumber = formData.idNumber.trim()
      let isValid = false
      let errorMessage = ''

      switch (formData.idType) {
        case 'National ID':
          // Saudi National ID: 10 digits starting with 1 or 2
          isValid = /^[12]\d{9}$/.test(idNumber)
          errorMessage = 'National ID must be 10 digits starting with 1 or 2'
          break
        case 'Iqama':
          // Iqama: 10 digits starting with 1 or 2
          isValid = /^[12]\d{9}$/.test(idNumber)
          errorMessage = 'Iqama number must be 10 digits starting with 1 or 2'
          break
        case 'Passport':
          // Passport: 6-12 alphanumeric characters
          isValid = /^[A-Za-z0-9]{6,12}$/.test(idNumber)
          errorMessage = 'Passport number must be 6-12 alphanumeric characters'
          break
        default:
          isValid = false
          errorMessage = 'Please select an ID type first'
      }

      if (!isValid) {
        newErrors.idNumber = errorMessage
      }
    }

    if (!formData.visitDate) {
      newErrors.visitDate = 'Date of visit is required'
    } else {
      // Check if date is in the future
      const selectedDate = new Date(formData.visitDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.visitDate = 'Please select a future date'
      }
    }

    if (!formData.consent) {
      newErrors.consent = 'You must agree to the terms'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Prepare form data matching API format
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
      }

      // API call to backend
      const response = await fetch('https://bgm.hackyard.io/backend/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.')
      }

      // Get QR image URL from response (check multiple possible field names)
      const qrUrl = data.qr_image_url || data.qrImageUrl || data.url
      
      if (!qrUrl) {
        throw new Error('QR code URL not found in response')
      }

      // Show QR panel first, then set the image URL
      setShowQRCode(true)
      setTimer(15) // Reset timer to 15 seconds

      // Set QR image URL after a brief delay to ensure panel is shown
      setTimeout(() => {
        setQrImageUrl(qrUrl)
      }, 100)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
      
      return newData
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCountrySelect = (countryCode) => {
    setFormData((prev) => ({ ...prev, countryCode }))
    setShowCountryPicker(false)
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === formData.countryCode)

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <img src="images/Frame.png" alt="Header" className="header-image" />
      </header>
      <div className="form-wrapper">
        <div className="header">
          <h1 className="main-title">YOUR JOURNEY BEGINS</h1>
          <h2 className="subtitle">BOOK NOW</h2>
        </div>

        <p className="intro-text">We look forward to welcoming you.</p>
        <p className="intro-text">Please complete the form below to register your visit.</p>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Allow backspace, delete, tab, escape, enter, arrows, space
                  if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                    return
                  }
                  if (!/[a-zA-Z]/.test(e.key)) {
                    e.preventDefault()
                  }
                }}
                maxLength="50"
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Allow backspace, delete, tab, escape, enter, arrows, space
                  if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
                    return
                  }
                  if (!/[a-zA-Z]/.test(e.key)) {
                    e.preventDefault()
                  }
                }}
                maxLength="50"
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group phone-group">
              <div className={`phone-input-wrapper ${errors.phone ? 'error' : ''}`}>
                <div className="country-selector">
                  <button
                    type="button"
                    className="country-button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                  >
                    {selectedCountry?.code}
                    <span className="arrow">▼</span>
                  </button>
                  {showCountryPicker && (
                    <div className="country-dropdown">
                      {COUNTRIES.map((country) => (
                        <div
                          key={country.code}
                          className="country-option"
                          onClick={() => handleCountrySelect(country.code)}
                        >
                          <span className="country-flag">{country.flag}</span>
                          <span className="country-name">{country.name}</span>
                          <span className="country-code">{country.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="phone-input"
                  onKeyDown={(e) => {
                    // Allow backspace, delete, tab, escape, enter, arrows
                    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                      return
                    }
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault()
                    }
                  }}
                  maxLength="15"
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  className={errors.idType ? 'error' : ''}
                >
                  <option value="">Choose your ID type</option>
                  {ID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">▼</span>
              </div>
              {errors.idType && <span className="error-message">{errors.idType}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="idNumber"
                placeholder="ID Number"
                value={formData.idNumber}
                onChange={handleChange}
                onKeyDown={(e) => {
                  // Allow backspace, delete, tab, escape, enter
                  if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    return
                  }

                  const idType = formData.idType
                  let allowedPattern = /./

                  switch (idType) {
                    case 'National ID':
                    case 'Iqama':
                      allowedPattern = /[0-9]/
                      break
                    case 'Passport':
                      allowedPattern = /[A-Za-z0-9]/
                      break
                    default:
                      allowedPattern = /[A-Za-z0-9]/
                  }

                  if (!allowedPattern.test(e.key)) {
                    e.preventDefault()
                  }
                }}
                onInput={(e) => {
                  const idType = formData.idType
                  let maxLength = 12

                  switch (idType) {
                    case 'National ID':
                    case 'Iqama':
                      maxLength = 10
                      break
                    case 'Passport':
                      maxLength = 12
                      break
                  }

                  if (e.target.value.length > maxLength) {
                    e.target.value = e.target.value.slice(0, maxLength)
                    setFormData(prev => ({ ...prev, idNumber: e.target.value }))
                  }
                }}
                className={errors.idNumber ? 'error' : ''}
              />
              {errors.idNumber && <span className="error-message">{errors.idNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                min={getMinDate()}
                className={errors.visitDate ? 'error' : ''}
              />
              {errors.visitDate && <span className="error-message">{errors.visitDate}</span>}
            </div>
          </div>

          <div className="consent-submit-row">
            <div className="consent-group">
              <div className="consent-checkbox-wrapper">
                <input
                  type="checkbox"
                  name="consent"
                  id="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className={`consent-checkbox ${errors.consent ? 'error' : ''}`}
                />
                <label htmlFor="consent" className="consent-label">
                  By submitting the form, you agree to the collection and processing of your personal
                  data in line with the Saudi Personal Data Protection Law and the website's Privacy
                  Policy.
                </label>
              </div>
              {errors.consent && <span className="error-message consent-error">{errors.consent}</span>}
            </div>

            <div className="submit-wrapper">
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? (
                  <span className="loader-wrapper">
                    <span className="loader"></span>
                    <span>Submitting...</span>
                  </span>
                ) : (
                  'SUBMIT'
                )}
              </button>
            </div>
          </div>
        </form>

        {showQRCode && (
          <div className="qr-code-overlay">
            <div className="qr-code-container">
              <h3>Your QR Code</h3>
              <div className="qr-code-image-wrapper">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="Your QR Code" className="qr-code-image" />
                ) : (
                  <div className="qr-loading">
                    <span className="loading-spinner"></span>
                    <span>Loading QR Code...</span>
                  </div>
                )}
              </div>
              <p className="qr-timer">This will disappear in {timer} second{timer !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
