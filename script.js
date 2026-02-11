const apiKey = "2063d8124f37c2a206ca0b5838684cfc";

const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherInfo = document.getElementById("weatherInfo");
const statusEl = document.getElementById("status");
const cityInput = document.getElementById("cityInput");
const unitButtons = document.querySelectorAll(".unit-btn");

let activeUnits = "metric";

const setStatus = (message) => {
    statusEl.textContent = message;
};

const setLoading = (isLoading) => {
    searchBtn.disabled = isLoading;
    locationBtn.disabled = isLoading;
    cityInput.disabled = isLoading;
};

const setEmptyState = () => {
    weatherInfo.classList.add("empty");
    weatherInfo.innerHTML = "";
};

const formatTemp = (value) => `${Math.round(value)}°`;

const updateUnits = (nextUnit) => {
    activeUnits = nextUnit;
    unitButtons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.unit === nextUnit);
    });
};

const fetchWeather = async (endpoint) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?${endpoint}&appid=${apiKey}&units=${activeUnits}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Weather fetch failed");
    }
    return response.json();
};

const displayWeather = (data) => {
    const iconCode = data.weather[0].icon;
    const description = data.weather[0].description;
    const windUnit = activeUnits === "metric" ? "m/s" : "mph";
    const tempUnit = activeUnits === "metric" ? "C" : "F";

    weatherInfo.classList.remove("empty");
    weatherInfo.innerHTML = `
        <div class="weather-main">
            <div class="weather-meta">
                <h2>${data.name}</h2>
                <p>${description} • ${data.sys.country}</p>
            </div>
            <div class="weather-icon">
                <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}">
            </div>
        </div>
        <p class="temp">${formatTemp(data.main.temp)}${tempUnit}</p>
        <div class="details">
            <div class="detail">
                <span>Feels like</span>
                <strong>${formatTemp(data.main.feels_like)}${tempUnit}</strong>
            </div>
            <div class="detail">
                <span>Humidity</span>
                <strong>${data.main.humidity}%</strong>
            </div>
            <div class="detail">
                <span>Wind</span>
                <strong>${Math.round(data.wind.speed)} ${windUnit}</strong>
            </div>
            <div class="detail">
                <span>Visibility</span>
                <strong>${(data.visibility / 1000).toFixed(1)} km</strong>
            </div>
        </div>
    `;
};

const getWeatherByCity = async (city) => {
    try {
        setLoading(true);
        setStatus("Fetching forecast...");
        const data = await fetchWeather(`q=${encodeURIComponent(city)}`);
        displayWeather(data);
        setStatus(`Updated just now for ${data.name}.`);
    } catch (error) {
        setEmptyState();
        setStatus("Could not find that city. Check spelling and try again.");
    } finally {
        setLoading(false);
    }
};

const getLocationWeather = () => {
    if (!navigator.geolocation) {
        setStatus("Geolocation is not supported in this browser.");
        return;
    }

    setLoading(true);
    setStatus("Locating you...");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const data = await fetchWeather(`lat=${lat}&lon=${lon}`);
                displayWeather(data);
                setStatus(`Updated just now for ${data.name}.`);
            } catch (error) {
                setEmptyState();
                setStatus("Location found, but weather data failed to load.");
            } finally {
                setLoading(false);
            }
        },
        () => {
            setLoading(false);
            setStatus("Location access denied. Search by city instead.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
};

searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (!city) {
        setStatus("Type a city name to search.");
        return;
    }
    getWeatherByCity(city);
});

cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchBtn.click();
    }
});

locationBtn.addEventListener("click", getLocationWeather);

unitButtons.forEach((button) => {
    button.addEventListener("click", () => {
        if (button.dataset.unit === activeUnits) {
            return;
        }
        updateUnits(button.dataset.unit);
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    });
});

setEmptyState();
setStatus("Search by city or use your location to begin.");