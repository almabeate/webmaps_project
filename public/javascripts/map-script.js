"use strict";

// Kartenlayer initialisieren
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmHotUrl = 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
var osmTopoUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
var osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors';

var osmLayer = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });
var osmHotLayer = L.tileLayer(osmHotUrl, { maxZoom: 18, attribution: osmAttrib });
var osmTopoLayer = L.tileLayer(osmTopoUrl, { maxZoom: 18, attribution: osmAttrib });
var googleUrl = 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}';
var googleAttrib = 'google';
var googleLayer = L.tileLayer(googleUrl, { attribution: googleAttrib });

var map = new L.Map('my_map', { center: new L.LatLng(51.05, 13.76), zoom: 3 });

var baseMaps = {
    "OpenStreetMap": osmLayer.addTo(map),
    "OpenStreetMap.HOT": osmHotLayer,
    "OpenStreetMap.TOPO": osmTopoLayer,
    "Google Sat": googleLayer
};
var drawnItem = new L.FeatureGroup()

var drawControl = new L.Control.Draw({
        draw: {
            polyline: false,
            polygon: false,
            circle: false,
            circlemarker: false,
            marker: false,
            rectangle: true // only allow rectangles
        },
        edit: {
            featureGroup: drawnItem,
            edit: true
        },
    });

// LayerGroup für Marker
map.on("draw:created", function(e){e.layer.addTo(drawnItem); withinBox()}) //Draw-Aufrufe durch eine Funktion verkürzt
map.on("draw:edited", withinBox)
map.on("draw:deleted", withinBox)

// Layer hinzufügen
drawControl.addTo(map)
drawnItem.addTo(map)

var displayMarkers = L.layerGroup().addTo(map);

var overlayMap = {"Städte": displayMarkers ,"Bounding Box": drawnItem};

var layerControl = L.control.layers(baseMaps, overlayMap).addTo(map);

L.control.layers(baseMaps).addTo(map);

// Koordinaten von Dresden
const coordinatesDD = turf.point([13.73836, 51.049259]);
console.log('Coordinates:', coordinatesDD);

add_data_to_map();

async function add_data_to_map() {
    const dataUrl = "http://localhost:5000/data";
    try {
        const response = await fetch(dataUrl);
        const data = await response.json();
        console.log("///", data);

        for (let i = 0; i < data.features.length; i++) {
            var lat = data.features[i].geometry.coordinates[1];
            var lon = data.features[i].geometry.coordinates[0];

             // Leaflet-Marker erstellen und den Stadtnamen als Eigenschaft speichern
             var marker = L.marker([lat, lon]);
             var distDD_ = turf.distance([lon, lat], coordinatesDD.geometry.coordinates, { units: 'kilometers' });
             var distDD = Math.round(distDD_ * 1000) / 1000; // Wert gerundet

             if (data.features[i].properties.cityname && data.features[i].properties.cityname.trim() !== "") {
                var cityname = data.features[i].properties.cityname;
                marker.cityname = cityname;
                var weatherNow = await fetchTemperatureInformation(cityname);
                var tempNow = weatherNow.temp;
                marker.bindPopup('<h4>' + cityname + '</h4><p>Entfernung zu Dresden: ' + distDD + ' km<br>Aktuelle Temperatur: ' + tempNow + '°C<br><a href="https://de.wikipedia.org/wiki/' + cityname + '" target="_blank">Weitere Infos (Einwohnerzahl, Land, usw.)</a></p>');
            }
            else {
                marker.bindPopup('<h4> Ortsname unbekannt </h4><p>Entfernung zu Dresden: ' + distDD + ' km</p>');
            }
            // Füge den Marker zur LayerGroup hinzu
            marker.addTo(displayMarkers);

            // Event-Listener für Klick auf den Marker
            marker.on('click', function (e) {
                console.log("Diagrammerstellung wurde gestartet");
                var clickedCity = e.target.cityname;
                console.log("Clicked city:", clickedCity);
                makeChart(clickedCity); // Aufruf der Diagrammfunktion mit dem Stadtnamen
            });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
async function withinBox() {
    displayMarkers.clearLayers(); // Alle Marker werden entfernt

    var box = drawnItem.toGeoJSON(); // toGeoJSON Funktion von Leaflet übernommen

    if (box.features.length == 0) { // Wenn es keine Box gibt, alle Städte anzeigen
        add_data_to_map();
    } else {
        console.log("Rechteck: ", box);

        try {
            const dataUrl = "http://localhost:5000/data";
            const response = await fetch(dataUrl);
            const data = await response.json();
            
            // Erstellen eines FeatureCollection-Objekts von allen Städten aus den Daten
            const points = data.features.map(feature => {
                var lat = feature.geometry.coordinates[1];
                var lon = feature.geometry.coordinates[0];
                return turf.point([lon, lat], feature.properties); // Umwandlung in turf.point
            });

            const featureCollection = turf.featureCollection(points);

            // Überprüfen, welche Punkte innerhalb der Box liegen
            const citiesWithin = turf.pointsWithinPolygon(featureCollection, box);

            console.log("Städte im ausgewählten Bereich: ", citiesWithin.features.length);

            for (let i = 0; i < citiesWithin.features.length; i++) {
                var cityFeature = citiesWithin.features[i];
                makeMarker(cityFeature); // Für alle Städte innerhalb Marker erstellen
                console.log(cityFeature.properties.cityname);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
}

async function makeMarker(cityFeature) {
    var lat = cityFeature.geometry.coordinates[1];
    var lon = cityFeature.geometry.coordinates[0];
    // Leaflet-Marker erstellen und den Stadtnamen als Eigenschaft speichern
    var marker = L.marker([lat, lon]);
    var distDD_ = turf.distance([lon, lat], coordinatesDD.geometry.coordinates, { units: 'kilometers' });
    var distDD = Math.round(distDD_ * 1000) / 1000; // Wert gerundet

    if (cityFeature.properties.cityname && cityFeature.properties.cityname.trim() !== "") {
        var cityname = cityFeature.properties.cityname;
        marker.cityname = cityname;
        var weatherNow = await fetchTemperatureInformation(cityname);
        var tempNow = weatherNow.temp;
        marker.bindPopup('<h4>' + cityname + '</h4><p>Entfernung zu Dresden: ' + distDD + ' km<br>Aktuelle Temperatur: ' + tempNow + '°C<br><a href="https://de.wikipedia.org/wiki/' + cityname + '" target="_blank">Weitere Infos (Einwohnerzahl, Land, usw.)</a></p>');
    }
    else {
        marker.bindPopup('<h4> Ortsname unbekannt </h4><p>Entfernung zu Dresden: ' + distDD + ' km</p>');
    }
    // Füge den Marker zur LayerGroup hinzu
    marker.addTo(displayMarkers);

    // Event-Listener für Klick auf den Marker
    marker.on('click', function (e) {
        console.log("Diagrammerstellung wurde gestartet");
        var clickedCity = e.target.cityname;
        console.log("Clicked city:", clickedCity);
        makeChart(clickedCity); // Aufruf der Diagrammfunktion mit dem Stadtnamen
    });
}