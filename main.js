const API_KEY = "40d2cd7ef1adf0713734f1623aae50c3"

const DAYS_OF_THE_WEEK = ["sun","mon","tue","wed","thu","fri","sat"];

const getCurrentWeatherData = async() => {
    const city = "chennai";
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    return response.json();
}

const getHourlyForecast = async ({name: city})=> {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
    const data = await response.json();
    return data.list.map(forecast => {
        const {main: {temp, temp_min, temp_max}, dt, dt_txt, weather: [{description,icon}]} = forecast;
        return {temp, temp_min, temp_max, dt, dt_txt, description, icon};
    })
}

const formatTemperature = (temp) => `${temp?.toFixed(1)}°`;
const createIconUrl = (icon) =>  `http://openweathermap.org/img/wn/${icon}@2x.png`

const loadCurrentForecast = ({ name, main: {temp, temp_max, temp_min}, weather: [{description}] }) => {
    const currentForecastElement = document.getElementById("current-forecast");
    currentForecastElement.querySelector(".city").textContent = name;
    currentForecastElement.querySelector(".temp").textContent = formatTemperature(temp);
    currentForecastElement.querySelector(".description").textContent = description;
    currentForecastElement.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L:${formatTemperature(temp_min)}`;
}
const loadHourlyForecast = ({main: {temp: tempNow}, weather: [{icon: iconNow}]}, hourlyForecast) => {
    const timeFormatter = Intl.DateTimeFormat("en", {
        hour12:true, hour:"numeric"
    })
    let dataFor12Hours = hourlyForecast.slice(2,14);
    const hourlyContainer = document.querySelector(".hourly-container");
    let innerHTMLString = 
        `<article>
         <h3 class="time">Now</h3>
         <img src="${createIconUrl(iconNow)}" alt="weather-icon" class="icon" />
         <p class="hourly-temp">${formatTemperature(tempNow)}</p>
         </article>`;

    for(let {temp, icon, dt_txt} of dataFor12Hours){
        innerHTMLString += 
        `<article>
         <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
         <img src="${createIconUrl(icon)}" alt="weather-icon" class="icon" />
         <p class="hourly-temp">${formatTemperature(temp)}</p>
         </article>`
    }
    hourlyContainer.innerHTML = innerHTMLString;
};

const calculateDayWiseForecast = (hourlyForecast) => {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(" ");
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        console.log(dayOfTheWeek)
        if(dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast);
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay);
        } else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }   
    }

    for(let [key,value] of dayWiseForecast) {
        let temp_min = Math.min(...Array.from(value, val => val.temp_min));
        let temp_max = Math.max(...Array.from(value, val => val.temp_max));
        
        dayWiseForecast.set(key, {temp_min, temp_max, icon: value.find(v => v.icon).icon})
    }
    console.log(dayWiseForecast)
    return dayWiseForecast
}

const loadFiveDayForecast = (hourlyForecast) => {
    console.log(hourlyForecast);
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    const container = document.querySelector(".five-day-forecast-container");
    let dayWiseInfo = "";
    Array.from(dayWiseForecast).map(([day, {temp_max, temp_min, icon}], index) => {

        if (index < 5) {
            dayWiseInfo += 
            `<article class="day-wise-forecast">
                <h3 class="day">${ index === 0 ? "today": day}</h3>
                <img src="${createIconUrl(icon)}" alt="weather-icon" class="icon" />
                <p class="min-temp">${formatTemperature(temp_min)}</p>
                <p class="max-temp">${formatTemperature(temp_max)}</p>
            </article>`
        }
    });

    container.innerHTML = dayWiseInfo;
}

const loadFeelsLike = ({main: {feels_like}}) => {
    let container = document.getElementById("feels-like");
    container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like);
}

const loadHumidity = ({main: {humidity}}) => {
    let container = document.getElementById("humidity");
    container.querySelector(".humidity-value").textContent = `${humidity}%`;
}
document.addEventListener("DOMContentLoaded", async() => {
    const currentWeather =  await getCurrentWeatherData();
    loadCurrentForecast(currentWeather);
    const hourlyForecast = await getHourlyForecast(currentWeather);
    loadHourlyForecast(currentWeather, hourlyForecast);
    loadFiveDayForecast(hourlyForecast);
    loadFeelsLike(currentWeather);
    loadHumidity(currentWeather);


})