// API configuration
const API_KEY = '9f01bcccc7b8d117f0a6a774274b9a14';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_ENDPOINTS = {
    weather: `${BASE_URL}/weather`,
    forecast: `${BASE_URL}/forecast`
};

// Time-based background handling for Mongolia
const timeBackgrounds = {
    // Mongolia-specific backgrounds
    mongolia: {
        sunrise: './img/ulaanbaatar/sunrise-mongolia.jpg',
        day: './img/ulaanbaatar/day-mongolia.jpg',
        sunset: './img/ulaanbaatar/sunset-mongolia.jpg',
        night: './img/ulaanbaatar/night-mongolia.jpg',
        rain: './img/ulaanbaatar/rain-mongolia.jpg'
    },
    // Default backgrounds for other locations
    default: {
        dark: './img/dark-default.jpg',  // Dark background for light mode
        light: './img/light-default.jpg'  // Light background for dark mode
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
    isCelsius: localStorage.getItem('isCelsius') === 'true' || true
};

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
        let response = await fetch(
            `${API_ENDPOINTS.forecast}?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Forecast data not available');
        
        const data = await response.json();
        
        // Process forecast data to get one forecast per day
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

        const forecastHTML = weekForecast.map(forecast => {
            const date = new Date(forecast.dt * 1000);
            const hour = date.getHours();
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dateStr = date.toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short' 
            });
            
            // Get base temperature in Celsius from API
            const tempCelsius = Math.round(forecast.main.temp);
            // Convert if needed
            const temp = state.isCelsius ? 
                tempCelsius : 
                Math.round((tempCelsius * 9/5) + 32);
            
            return `
                <div class="forecast-day">
                    <div class="forecast-icon">
                        <span class="material-symbols-outlined">
                            ${getWeatherIcon(forecast.weather[0].id, hour)}
                        </span>
                    </div>
                    <div class="forecast-info">
                        <span class="day">${day}</span>
                        <span class="date">${dateStr}</span>
                    </div>
                    <div class="forecast-temp">${temp}°${state.isCelsius ? 'C' : 'F'}</div>
                </div>
            `;
        }).join('');

        document.querySelector('.forecast').innerHTML = `
            <h3>7-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        `;

    } catch (error) {
        console.error('Error fetching forecast:', error);
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
            `${API_ENDPOINTS.weather}?q=Ulaanbaatar,MN&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) throw new Error('Could not fetch Ulaanbaatar weather');
        
        const weatherData = await response.json();
        
        // Update displays
        await updateWeatherDisplay(weatherData);
        await updateBackgroundByWeather(weatherData);
        await updateForecast('Ulaanbaatar');
        
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

// Update the background by weather function
async function updateBackgroundByWeather(weatherData) {
    const isMongolia = weatherData.sys.country === 'MN';
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (isMongolia) {
        // Use Mongolia-specific backgrounds
        const mongoliaTime = getMongoliaTime();
        const hour = mongoliaTime.getHours();

        // Check if it's raining first
        const weatherId = weatherData.weather[0].id;
        if (weatherId >= 200 && weatherId < 700) {
            changeBackground(timeBackgrounds.mongolia.rain);
            return;
        }

        // If not raining, use time-based background
        let backgroundImage;
        if (hour >= 6 && hour < 12) {
            backgroundImage = timeBackgrounds.mongolia.sunrise;
        } else if (hour >= 12 && hour < 18) {
            backgroundImage = timeBackgrounds.mongolia.day;
        } else if (hour >= 18 && hour < 22) {
            backgroundImage = timeBackgrounds.mongolia.night;
        } else {
            backgroundImage = timeBackgrounds.mongolia.sunset;
        }
        
        changeBackground(backgroundImage);
    } else {
        // Use default backgrounds for other locations
        changeBackground(isDarkMode ? 
            timeBackgrounds.default.light : // Light background for dark mode
            timeBackgrounds.default.dark    // Dark background for light mode
        );
    }
}

// Update the weather display to use Mongolia time
async function updateWeatherDisplay(data) {
    try {
        const mongoliaTime = getMongoliaTime();
        
        // Format time string
        const timeString = mongoliaTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        // Format date string
        const dateString = mongoliaTime.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: '2-digit'
        });

        // Update time display
        document.querySelector('.datetime').textContent = `${timeString} - ${dateString}`;
        
        // Rest of your updateWeatherDisplay code...
        const tempCelsius = Math.round(data.main.temp);
        const temp = state.isCelsius ? 
            tempCelsius : 
            Math.round((tempCelsius * 9/5) + 32);

        document.querySelector('.temperature').textContent = `${temp}°${state.isCelsius ? 'C' : 'F'}`;
        document.querySelector('.location').textContent = `${data.name}, ${data.sys.country}`;
        
        // Update weather icon using Mongolia time
        const weatherIcon = document.querySelector('.weather-icon');
        if (weatherIcon) {
            weatherIcon.innerHTML = `
                <span class="material-symbols-outlined">
                    ${getWeatherIcon(data.weather[0].id, mongoliaTime.getHours())}
                </span>
            `;
        }

        // Update weather stats
        const windSpeed = Math.round(data.wind.speed);
        const humidity = data.main.humidity;
        
        const statsHTML = `
            <div class="stat">
                <span class="material-symbols-outlined">air</span>
                <span>${windSpeed} M/s</span>
            </div>
            <div class="stat">
                <span class="material-symbols-outlined">humidity_percentage</span>
                <span>${humidity}%</span>
            </div>
        `;
        document.querySelector('.weather-stats').innerHTML = statsHTML;

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
    initializeControls();
    getUlaanbaatarWeather(); // Start Ulaanbaatar weather
    
    // Update 5 minutes
    setInterval(getUlaanbaatarWeather, 300000);
});