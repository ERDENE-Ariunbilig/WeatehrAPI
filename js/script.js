// API configuration
const API_KEY = '9f01bcccc7b8d117f0a6a774274b9a14';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_ENDPOINTS = {
    weather: `${BASE_URL}/weather`,
    forecast: `${BASE_URL}/forecast`
};
const translations = {
    en: {
        searchPlaceholder: "Search Location...",
        forecast: "7-Day Forecast",
        settings: "Settings",
        celsius: "°C",
        fahrenheit: "°F",
        windSpeed: "M/s",
        humidity: "Humidity",
        months: {
            Jan: 'Jan', Feb: 'Feb', Mar: 'Mar', Apr: 'Apr',
            May: 'May', Jun: 'Jun', Jul: 'Jul', Aug: 'Aug',
            Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dec'
        },
        days: {
            'Monday': 'Mon',
            'Tue': 'Tue',
            'Wed': 'Wed',
            'Thu': 'Thu',
            'Fri': 'Fri',
            'Sat': 'Sat',
            'Sun': 'Sun'
        }
    },
    mn: {
        searchPlaceholder: "Байршил хайх...",
        forecast: "7 хоногийн урьдчилсан мэдээ",
        settings: "Тохиргоо",
        celsius: "°C",
        fahrenheit: "°F",
        windSpeed: "М/с",
        humidity: "Чийгшил",
        months: {
            Jan: '1-р сар', Feb: '2-р сар', Mar: '3-р сар', Apr: '4-р сар',
            May: '5-р сар', Jun: '6-р сар', Jul: '7-р сар', Aug: '8-р сар',
            Sep: '9-р сар', Oct: '10-р сар', Nov: '11-р сар', Dec: '12-р сар'
        },
        days: {
            'Mon': 'Даваа',
            'Tue': 'Мягмар',
            'Wed': 'Лхагва',
            'Thu': 'Пүрэв',
            'Fri': 'Баасан',
            'Sat': 'Бямба',
            'Sun': 'Ням'
        }
    }
};

// Update the background configuration with sunrise/sunset for default
const backgroundConfig = {
    // Default backgrounds (non-Mongolian locations)
    default: {
        sunrise: './background/default/sunrise.jpg',
        day: './background/default/day.jpg',
        sunset: './background/default/sunset.jpg',
        night: './background/default/night.jpg',
        rain: './background/default/rain.jpg',
        snow: './background/default/snow.jpg',
        cloudy: './background/default/cloudy.jpg'
    },
    // Mongolian cities (except UB) with seasonal variations
    mongolia: {
        summer: {
            sunrise: './background/mongolia/summer/sunrise.jpg',
            day: './background/mongolia/summer/day.jpg',
            sunset: './background/mongolia/summer/sunset.jpg',
            night: './background/mongolia/summer/night.jpg',
            rain: './background/mongolia/summer/rain.jpg'
        },
        winter: {
            sunrise: './background/mongolia/winter/sunrise.jpg',
            day: './background/mongolia/winter/day.jpg',
            sunset: './background/mongolia/winter/sunset.jpg',
            night: './background/mongolia/winter/night.jpg',
            snow: './background/mongolia/winter/snow.jpg'
        }
    },
    // Ulaanbaatar with seasonal variations
    ulaanbaatar: {
        summer: {
            sunrise: './background/ulaanbaatar/summer/sunrise.jpg',
            day: './background/ulaanbaatar/summer/day.jpg',
            sunset: './background/ulaanbaatar/summer/sunset.jpg',
            night: './background/ulaanbaatar/summer/night.jpg',
            rain: './background/ulaanbaatar/summer/rain.jpg'
        },
        winter: {
            sunrise: './background/ulaanbaatar/winter/sunrise.jpg',
            day: './background/ulaanbaatar/winter/day.jpg',
            sunset: './background/ulaanbaatar/winter/sunset.jpg',
            night: './background/ulaanbaatar/winter/night.jpg',
            snow: './background/ulaanbaatar/winter/snow.jpg'
        }
    }
};

// Weather icon mapping
const weatherIcons = {
    sunny: 'sunny',
    cloudy: 'cloud',
    snow: 'cloudy_snowing',
    sunrise: 'sunny_snowing',
    sunset: 'routine',
    rain: 'rainy',
    night: 'bedtime'
};

// State management
const state = {
    isDarkMode: localStorage.getItem('isDarkMode') === 'true' || true,
    isCelsius: localStorage.getItem('isCelsius') === 'true' || true,
    language: localStorage.getItem('language') || 'en'
};

// Function to get localized day name
function getLocalizedDay(date) {
    // Get the day name in English first
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Return the translated day name from our translations object
    return translations[state.language].days[dayName] || dayName;
}

// Function to get localized month name
function getLocalizedMonth(date) {
    const englishMonth = date.toLocaleDateString('en-US', { month: 'short' });
    return translations[state.language].months[englishMonth];
}

// Function to get weather icon based on weather ID and time
function getWeatherIcon(weatherId, hour) {
    // Night time
    if (hour >= 22 || hour < 6) {
        return 'bedtime';
    }
    
    // Weather conditions
    if (weatherId >= 200 && weatherId < 300) return 'rainy'; // Thunderstorm
    if (weatherId >= 300 && weatherId < 500) return 'rainy'; // Drizzle
    if (weatherId >= 500 && weatherId < 600) return 'rainy'; // Rain
    if (weatherId >= 600 && weatherId < 700) return 'cloudy_snowing'; // Snow
    if (weatherId >= 700 && weatherId < 800) return 'cloud'; // Atmosphere
    if (weatherId === 800) {
        // Clear sky - check time for sun position
        if (hour >= 6 && hour < 12) return 'sunny_snowing'; // Sunrise
        if (hour >= 18 && hour < 22) return 'routine'; // Sunset
        return 'sunny'; // Daytime
    }
    return 'cloud'; // Cloudy
}

// Function to handle search
async function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchQuery = searchInput.value.trim();
    
    if (searchQuery) {
        try {
            let weatherData;
            let response;

            try {
                // First try with Mongolia suffix
                response = await fetch(
                    `${API_ENDPOINTS.weather}?q=${searchQuery},MN&appid=${API_KEY}&units=metric`
                );
                if (response.ok) {
                    weatherData = await response.json();
                }
            } catch (error) {
                console.log('Not found in Mongolia, trying worldwide...');
            }

            // If not found in Mongolia, try worldwide
            if (!weatherData) {
                response = await fetch(
                    `${API_ENDPOINTS.weather}?q=${searchQuery}&appid=${API_KEY}&units=metric`
                );
                if (response.ok) {
                    weatherData = await response.json();
                } else {
                    throw new Error('Location not found');
                }
            }

            // If we have weather data, update the UI
            if (weatherData) {
                await updateWeatherDisplay(weatherData);
                await updateBackgroundByWeather(weatherData);
                await updateForecast(searchQuery);
                
                // Clear input after successful search
                searchInput.value = '';
            }
            
        } catch (error) {
            console.error('Search error:', error);
            alert('Location not found. Please try again.');
        }
    }
}

// Function to handle location button click
async function handleLocationSearch() {
    const locationBtn = document.getElementById('get-location');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    // Disable button and show loading state
    locationBtn.disabled = true;
    locationBtn.innerHTML = '<span class="material-symbols-outlined loading">sync</span>';

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        
        // Get weather data for coordinates
        const response = await fetch(
            `${API_ENDPOINTS.weather}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Weather data not available');
        const weatherData = await response.json();
        
        // Update displays
        await updateWeatherDisplay(weatherData);
        await updateBackgroundByWeather(weatherData);
        await updateForecast(weatherData.name);
        
    } catch (error) {
        console.error('Location error:', error);
        alert('Unable to get your location. Please check your location permissions.');
    } finally {
        // Reset button state
        locationBtn.disabled = false;
        locationBtn.innerHTML = '<span class="material-symbols-outlined">my_location</span>';
    }
}

// Function to update forecast with full week
async function updateForecast(city) {
    try {
        console.log('Updating forecast for:', city); // Debug log
        
        const response = await fetch(
            `${API_ENDPOINTS.forecast}?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Forecast data not available');
        
        const data = await response.json();
        console.log('Forecast data received:', data); // Debug log
        
        // Process forecast data
        const dailyForecasts = {};
        
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyForecasts[dateKey] || 
                Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyForecasts[dateKey].dt * 1000).getHours() - 12)) {
                dailyForecasts[dateKey] = forecast;
            }
        });

        const weekForecast = Object.values(dailyForecasts).slice(0, 7);
        
        // Generate forecast HTML
        const forecastHTML = weekForecast.map(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = getLocalizedDay(date);
            const month = getLocalizedMonth(date);
            const dateNum = date.getDate();
            
            const tempCelsius = Math.round(forecast.main.temp);
            const temp = state.isCelsius ? 
                tempCelsius : 
                Math.round((tempCelsius * 9/5) + 32);
            
            return `
                <div class="forecast-day">
                    <div class="forecast-icon">
                        <span class="material-symbols-outlined">
                            ${getWeatherIcon(forecast.weather[0].id, date.getHours())}
                        </span>
                    </div>
                    <div class="forecast-info">
                        <span class="day">${day}</span>
                        <span class="date">${dateNum} ${month}</span>
                    </div>
                    <div class="forecast-temp">${temp}°${state.isCelsius ? 'C' : 'F'}</div>
                </div>
            `;
        }).join('');

        // Update the forecast container
        const forecastElement = document.querySelector('.forecast');
        if (forecastElement) {
            forecastElement.innerHTML = `
                <h3>${translations[state.language].forecast}</h3>
                <div class="forecast-container">
                    ${forecastHTML}
                </div>
            `;
            console.log('Forecast HTML updated'); // Debug log
        } else {
            console.error('Forecast element not found'); // Debug log
        }

    } catch (error) {
        console.error('Error updating forecast:', error);
    }
}

// Function to smoothly change background
function changeBackground(newImageUrl) {
    const tempImg = new Image();
    tempImg.src = newImageUrl;
    tempImg.onload = () => {
        document.body.style.backgroundImage = `url('${newImageUrl}')`;
    };
}

// Function to get Ulaanbaatar weather on startup
async function getUlaanbaatarWeather() {
    try {
        const response = await fetch(
            `${API_ENDPOINTS.weather}?q=Ulaanbaatar&appid=${API_KEY}&units=metric`
        );
        if (response.ok) {
            const weatherData = await response.json();
            await updateWeatherDisplay(weatherData);
            await updateForecast('Ulaanbaatar');
        }
    } catch (error) {
        console.error('Error getting Ulaanbaatar weather:', error);
    }
}

// Function to get Mongolia time
function getMongoliaTime() {
    // Mongolia is UTC+8
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 8)); // UTC+8 for Mongolia
}

// Function to determine season in Mongolia
function getMongolianSeason() {
    const date = getMongoliaTime();
    const month = date.getMonth() + 1; // JavaScript months are 0-11

    // Summer: June to August (6-8)
    // Winter: November to March (11-3)
    // Transitional months (Spring/Autumn) default to the nearest major season
    if (month >= 6 && month <= 8) {
        return 'summer';
    } else if (month >= 11 || month <= 3) {
        return 'winter';
    } else if (month >= 4 && month <= 5) {
        return 'winter'; // Late spring defaults to winter
    } else {
        return 'winter'; // Early autumn defaults to winter
    }
}

// Function to get local time for any location
function getLocationTime(timezone) {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (1000 * timezone)); // timezone offset in seconds from API
}

// Update the background selection function
async function updateBackgroundByWeather(weatherData) {
    const isUlaanbaatar = weatherData.name === 'Ulaanbaatar';
    const isMongolia = weatherData.sys.country === 'MN';
    
    // Get appropriate time based on location
    const locationTime = isMongolia ? 
        getMongoliaTime() : 
        getLocationTime(weatherData.timezone);
    
    const hour = locationTime.getHours();
    
    // Select the appropriate background set
    let backgroundSet;
    if (!isMongolia) {
        backgroundSet = backgroundConfig.default;
    } else {
        const season = getMongolianSeason();
        if (isUlaanbaatar) {
            backgroundSet = backgroundConfig.ulaanbaatar[season];
        } else {
            backgroundSet = backgroundConfig.mongolia[season];
        }
    }

    // Get weather conditions
    const weatherId = weatherData.weather[0].id;

    // Select background based on weather conditions first
    let backgroundImage;

    // Check weather conditions
    if (weatherId >= 200 && weatherId < 600) { // Rain and thunderstorm
        backgroundImage = backgroundSet.rain || backgroundSet.snow; // Use snow in winter if rain not available
    } else if (weatherId >= 600 && weatherId < 700) { // Snow
        backgroundImage = backgroundSet.snow || backgroundSet.rain; // Use rain in summer if snow not available
    } else if (weatherId >= 801 && weatherId <= 804) { // Cloudy
        if (!isMongolia) {
            backgroundImage = backgroundSet.cloudy;
        } else {
            // For Mongolia, use time-based background instead of cloudy
            if (hour >= 5 && hour < 7) {
                backgroundImage = backgroundSet.sunrise;
            } else if (hour >= 7 && hour < 17) {
                backgroundImage = backgroundSet.day;
            } else if (hour >= 17 && hour < 19) {
                backgroundImage = backgroundSet.sunset;
            } else {
                backgroundImage = backgroundSet.night;
            }
        }
    } else {
        // If weather is clear, use time-based background
        if (hour >= 5 && hour < 7) {
            backgroundImage = backgroundSet.sunrise;
        } else if (hour >= 7 && hour < 17) {
            backgroundImage = backgroundSet.day;
        } else if (hour >= 17 && hour < 19) {
            backgroundImage = backgroundSet.sunset;
        } else {
            backgroundImage = backgroundSet.night;
        }
    }

    // Change background with transition
    changeBackground(backgroundImage);
}

// Add this function to format the date and time
function formatDateTime(date, language) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    const day = translations[language].days[date.toLocaleDateString('en-US', { weekday: 'short' })];
    const month = translations[language].months[date.toLocaleDateString('en-US', { month: 'short' })];
    const dateNum = date.getDate();
    const year = date.getFullYear().toString().slice(-2);

    if (language === 'mn') {
        return `${hour12}:${minutes} ${ampm} - ${day}, ${month} ${dateNum}, '${year}`;
    } else {
        return `${hour12}:${minutes} ${ampm} - ${day}, ${month} ${dateNum}, '${year}`;
    }
}

// Update the updateWeatherDisplay function
async function updateWeatherDisplay(data) {
    try {
        // Get location time
        const locationTime = data.sys.country === 'MN' ? 
            getMongoliaTime() : 
            getLocationTime(data.timezone);
        
        // Format date and time using the new function
        const formattedDateTime = formatDateTime(locationTime, state.language);
        document.querySelector('.datetime').textContent = formattedDateTime;

        // Rest of your updateWeatherDisplay code...
        const tempCelsius = Math.round(data.main.temp);
        const temp = state.isCelsius ? 
            tempCelsius : 
            Math.round((tempCelsius * 9/5) + 32);

        document.querySelector('.temperature').textContent = `${temp}°${state.isCelsius ? 'C' : 'F'}`;
        document.querySelector('.location').textContent = `${data.name}, ${data.sys.country}`;
        
        // Update weather icon
        const weatherIcon = document.querySelector('.weather-icon');
        if (weatherIcon) {
            weatherIcon.innerHTML = `
                <span class="material-symbols-outlined">
                    ${getWeatherIcon(data.weather[0].id, locationTime.getHours())}
                </span>
            `;
        }

        // Update weather stats with translations
        const windSpeed = Math.round(data.wind.speed);
        const humidity = data.main.humidity;
        
        const statsHTML = `
            <div class="stat">
                <span class="material-symbols-outlined">air</span>
                <span>${windSpeed} ${translations[state.language].windSpeed}</span>
            </div>
            <div class="stat">
                <span class="material-symbols-outlined">humidity_percentage</span>
                <span>${humidity}% ${translations[state.language].humidity}</span>
            </div>
        `;
        document.querySelector('.weather-stats').innerHTML = statsHTML;

        // Update forecast after main display is updated
        await updateForecast(data.name);

    } catch (error) {
        console.error('Error updating weather display:', error);
    }
}

// Initialize controls
function initializeControls() {
    const modeSwitch = document.getElementById('mode-switch');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const celsiusBtn = document.getElementById('celsius');
    const fahrenheitBtn = document.getElementById('fahrenheit');
    const searchInput = document.getElementById('search-input');
    const locationBtn = document.getElementById('get-location');

    // Apply initial theme
    applyTheme(state.isDarkMode);

    // Apply initial temperature unit
    if (state.isCelsius) {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    } else {
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
    }

    // Theme switcher
    modeSwitch.addEventListener('click', () => {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('isDarkMode', state.isDarkMode);
        applyTheme(state.isDarkMode);
    });

    // Settings toggle
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsModal.classList.toggle('active');
    });

    // Temperature unit toggles
    celsiusBtn.addEventListener('click', async () => {
        if (!state.isCelsius) {
            state.isCelsius = true;
            localStorage.setItem('isCelsius', 'true');
            celsiusBtn.classList.add('active');
            fahrenheitBtn.classList.remove('active');
            
            // Get current city and refresh weather data
            const cityName = document.querySelector('.location').textContent.split(',')[0];
            try {
                const response = await fetch(
                    `${API_ENDPOINTS.weather}?q=${cityName}&appid=${API_KEY}&units=metric`
                );
                const weatherData = await response.json();
                await updateWeatherDisplay(weatherData);
                await updateForecast(cityName);
            } catch (error) {
                console.error('Error updating temperature unit:', error);
            }
        }
    });

    fahrenheitBtn.addEventListener('click', async () => {
        if (state.isCelsius) {
            state.isCelsius = false;
            localStorage.setItem('isCelsius', 'false');
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            
            // Get current city and refresh weather data
            const cityName = document.querySelector('.location').textContent.split(',')[0];
            try {
                const response = await fetch(
                    `${API_ENDPOINTS.weather}?q=${cityName}&appid=${API_KEY}&units=metric`
                );
                const weatherData = await response.json();
                await updateWeatherDisplay(weatherData);
                await updateForecast(cityName);
            } catch (error) {
                console.error('Error updating temperature unit:', error);
            }
        }
    });

    // Search functionality
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });

    // Location button
    locationBtn.addEventListener('click', handleLocationSearch);

    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        if (settingsModal.classList.contains('active') && 
            !settingsModal.contains(e.target) && 
            !settingsBtn.contains(e.target)) {
            settingsModal.classList.remove('active');
        }
    });

    // Language controls
    const langEn = document.getElementById('lang-en');
    const langMn = document.getElementById('lang-mn');

    langEn.addEventListener('click', () => {
        if (state.language !== 'en') {
            langEn.classList.add('active');
            langMn.classList.remove('active');
            switchLanguage('en');
        }
    });

    langMn.addEventListener('click', () => {
        if (state.language !== 'mn') {
            langMn.classList.add('active');
            langEn.classList.remove('active');
            switchLanguage('mn');
        }
    });

    // Set initial language state
    if (state.language === 'mn') {
        langMn.classList.add('active');
        langEn.classList.remove('active');
    }

    // Initial language setup
    updateUILanguage();
}

// Apply theme function
function applyTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const modeIcon = document.querySelector('#mode-switch .material-symbols-outlined');
    if (modeIcon) {
        modeIcon.textContent = isDark ? 'dark_mode' : 'light_mode';
    }
}

// Update initialization
document.addEventListener('DOMContentLoaded', () => {
    preloadBackgroundImages();
    // First load everything immediately
    loadInitialWeather();
    
    // Then set up the controls and event listeners
    initializeControls();
    setupLanguageControls();
});

// Add this new function for initial weather load
async function loadInitialWeather() {
    try {
        // Get Ulaanbaatar weather
        const response = await fetch(
            `${API_ENDPOINTS.weather}?q=Ulaanbaatar&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Weather data not available');
        
        const weatherData = await response.json();
        
        // Update weather display which will also trigger forecast update
        await updateWeatherDisplay(weatherData);
        
        // Force forecast update immediately
        await updateForecast('Ulaanbaatar');
        
    } catch (error) {
        console.error('Error loading initial weather:', error);
    }
}

// Update the updateForecast function to ensure it always runs
async function updateForecast(city) {
    try {
        console.log('Updating forecast for:', city); // Debug log
        
        const response = await fetch(
            `${API_ENDPOINTS.forecast}?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Forecast data not available');
        
        const data = await response.json();
        console.log('Forecast data received:', data); // Debug log
        
        // Process forecast data
        const dailyForecasts = {};
        
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyForecasts[dateKey] || 
                Math.abs(date.getHours() - 12) < Math.abs(new Date(dailyForecasts[dateKey].dt * 1000).getHours() - 12)) {
                dailyForecasts[dateKey] = forecast;
            }
        });

        const weekForecast = Object.values(dailyForecasts).slice(0, 7);
        
        // Generate forecast HTML
        const forecastHTML = weekForecast.map(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = getLocalizedDay(date);
            const month = getLocalizedMonth(date);
            const dateNum = date.getDate();
            
            const tempCelsius = Math.round(forecast.main.temp);
            const temp = state.isCelsius ? 
                tempCelsius : 
                Math.round((tempCelsius * 9/5) + 32);
            
            return `
                <div class="forecast-day">
                    <div class="forecast-icon">
                        <span class="material-symbols-outlined">
                            ${getWeatherIcon(forecast.weather[0].id, date.getHours())}
                        </span>
                    </div>
                    <div class="forecast-info">
                        <span class="day">${day}</span>
                        <span class="date">${dateNum} ${month}</span>
                    </div>
                    <div class="forecast-temp">${temp}°${state.isCelsius ? 'C' : 'F'}</div>
                </div>
            `;
        }).join('');

        // Update the forecast container
        const forecastElement = document.querySelector('.forecast');
        if (forecastElement) {
            forecastElement.innerHTML = `
                <h3>${translations[state.language].forecast}</h3>
                <div class="forecast-container">
                    ${forecastHTML}
                </div>
            `;
            console.log('Forecast HTML updated'); // Debug log
        } else {
            console.error('Forecast element not found'); // Debug log
        }

    } catch (error) {
        console.error('Error updating forecast:', error);
    }
}

// Add this function to set up language controls
function setupLanguageControls() {
    const langEn = document.getElementById('lang-en');
    const langMn = document.getElementById('lang-mn');
    
    if (langEn && langMn) {
        // Set initial language state
        const currentLang = localStorage.getItem('language') || 'en';
        if (currentLang === 'mn') {
            langMn.classList.add('active');
            langEn.classList.remove('active');
            state.language = 'mn';
        }

        // Add click handlers
        langEn.addEventListener('click', () => {
            if (state.language !== 'en') {
                langEn.classList.add('active');
                langMn.classList.remove('active');
                switchLanguage('en');
            }
        });

        langMn.addEventListener('click', () => {
            if (state.language !== 'mn') {
                langMn.classList.add('active');
                langEn.classList.remove('active');
                switchLanguage('mn');
            }
        });
    }
}

// Update switchLanguage function
function switchLanguage(lang) {
    state.language = lang;
    localStorage.setItem('language', lang);
    
    // Update UI elements with new language
    document.getElementById('search-input').placeholder = translations[lang].searchPlaceholder;
    document.querySelector('.settings-modal h3').textContent = translations[lang].settings;
    
    // Refresh weather data to update translations
    const cityName = document.querySelector('.location').textContent.split(',')[0];
    refreshWeatherData(cityName);
}

// Update refreshWeatherData function
async function refreshWeatherData(cityName) {
    try {
        const response = await fetch(
            `${API_ENDPOINTS.weather}?q=${cityName}&appid=${API_KEY}&units=metric`
        );
        if (response.ok) {
            const weatherData = await response.json();
            await updateWeatherDisplay(weatherData);
        }
    } catch (error) {
        console.error('Error refreshing weather data:', error);
    }
}

// Add this function
function preloadBackgroundImages() {
    const preloadImage = (url) => {
        const img = new Image();
        img.src = url;
    };

    // Preload all possible backgrounds
    Object.values(backgroundConfig).forEach(config => {
        if (typeof config === 'object') {
            if (config.summer || config.winter) {
                // Handle seasonal configurations
                ['summer', 'winter'].forEach(season => {
                    if (config[season]) {
                        Object.values(config[season]).forEach(preloadImage);
                    }
                });
            } else {
                // Handle default configuration
                Object.values(config).forEach(preloadImage);
            }
        }
    });
}