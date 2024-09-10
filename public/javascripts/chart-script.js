"use strict"
const apiKey = '934842e4e91b6a8fd12dc24981d40b92'; // mein eigener API-Key
let dbCities = {}; // Initialisierung von dbCities

async function geoCode(city_name) {
    const apiUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city_name}&limit=5&appid=${apiKey}`;
    try {
        const response = await fetch(apiUrl)
        const data = await response.json()
        const lat = data[0].lat
        const lon = data[0].lon
        const name = data[0].name
        //console.log(`Ort: ${name}, Breitengrad: ${lat}; Längengrad: ${lon}`)
        return { "place": name, "latitude": lat, "longitude": lon }
    } catch (error) {
        console.error('Error fetching data:', error)
    }
}

// Funktion zur Abrufung der Temperaturinformationen für 30 Tage
async function fetch30DayForecast(city_name) {
    const apiKey30 = '33443616f16e27119e88eed1d23a2326';
    let city_coordinates = await geoCode(city_name);
    let lat = city_coordinates.latitude;
    let lon = city_coordinates.longitude;
    
    const apiUrl =  `https://pro.openweathermap.org/data/2.5/forecast/climate?lat=${lat}&lon=${lon}&appid=${apiKey30}&units=metric&lang=de`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Listen initialisieren
        const min_temp = [];
        const max_temp = [];
        const day_temp = [];
        console.log("Fehlersuche:",data)
        if (data.list && data.list.length > 0) {
            // Schleife durch die Liste der Tage
            for (let i = 0; i < data.list.length; i++) {
                const dayData = data.list[i];
                min_temp.push(dayData.temp.min); 
                max_temp.push(dayData.temp.max);
                day_temp.push(dayData.temp.day);
            }
            return { "min": min_temp, "max": max_temp, "day": day_temp };
        } else {
            throw new Error('Keine Wetterdaten verfügbar');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchTemperatureInformation(city_name) {
    let city_coordinates = await geoCode(city_name)
    let lat = city_coordinates.latitude
    let lon = city_coordinates.longitude
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=de`
    try {
        const response = await fetch(apiUrl)
        const data = await response.json()
        const temperature = data.main.temp
        const description = data.weather[0].description
        const location = data.name
        const text = `Temperatur in ${location}: ${temperature}°C; Wetter: ${description}`
        //console.log(text)
        return { "temp": temperature, "weather": description }
    } catch (error) {
        console.error('Error fetching data with fetchTemperatureInformation:', error)
    }
}

//Daten aus Mongo
async function db_cities() {
    const dataUrl = "http://localhost:5000/data"
    try {
        const response = await fetch(dataUrl)
        dbCities = await response.json()
        console.log("Die Städte aus der Datenbank: \n", dbCities)
    } catch (error) {
        console.error('Error fetching data with db_cities:', error)
    }
}

// Erstellen des Diagramms
async function makeChart(cityName) {
    console.log("Make Chart stared")
    const forecastData = await fetch30DayForecast(cityName);

    const labels = Array.from({ length: 30 }, (_, i) => `Tag ${i + 1}`);

    let my_data = {
        labels: labels,
        datasets: [
            {
                label: 'Minimale Temperatur [°C]',
                data: forecastData.min,
                borderColor: 'blue',
                fill: false,
                tension: 0.1
            },
            {
                label: 'Maximale Temperatur [°C]',
                data: forecastData.max,
                borderColor: 'red',
                fill: false,
                tension: 0.1
            },
            {
                label: 'Durchschnittstemperatur [°C]',
                data: forecastData.day,
                borderColor: 'green',
                fill: false,
                tension: 0.1
            }
        ]
    };

    // clear the canvas:
    let chartStatus = Chart.getChart("myChart"); // canvas-id
    if (chartStatus != undefined) {
        chartStatus.destroy();
    }

    // specify config information
    const config = {
        maintainAspectRatio: 'true',
        type: 'line',
        data: my_data, // enthält Werte und Label
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    var my_chart = new Chart(document.getElementById('myChart'), config); // Ein neues Liniendiagramm wird erzeugt
}