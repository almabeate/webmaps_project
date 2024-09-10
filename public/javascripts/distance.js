"use strict"
class Point{ // Konstruktor mit 3 Eigenschaften
    constructor(lat, lon, name) 
    {
        this.lat = lat
        this.lon = lon
        this.name = name
    }
}

let convert_distance_to_kilometers = distance_in_m => distance_in_m/1000

function compute_geographic_distance(point1, point2, unit) //Input-Werte
        {
            const lat1 = point1.lat // die Input-Werte werden in der Funktion nutzbar gemacht
            const lat2 = point2.lat
            const lon1 = point1.lon
            const lon2 = point2.lon

                const R = 6371e3; // Meter
                const d1 = lat1 * Math.PI/180; // φ, λ in Radiant
                const d2 = lat2 * Math.PI/180;
                const deltaD = (lat2-lat1) * Math.PI/180;
                const deltaL = (lon2-lon1) * Math.PI/180;

                const a = Math.sin(deltaD/2) * Math.sin(deltaD/2) +
                        Math.cos(d1) * Math.cos(d2) *
                        Math.sin(deltaL/2) * Math.sin(deltaL/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

            let d = 0 //Default-value
            if (unit === "m")  {
                 d = R * c; // in m
            }
            if (unit === "km")  {
                 d = convert_distance_to_kilometers(R * c) // in km, Funktion wird aufgerufen
            }
            return d // man erhält die geographic_distance wenn man die Funktion aufruft
        }

function farest2nearest(cities, new_point)
    {
        let city = cities
        const num_elem = city.features.length
        let x = 0;                          //Default Werte
        var dist = []                       //Default Werte
        var geg_city = new Point(0, 0, "")  //Default Werte
        var citynamelist = []               //Default Werte
        for (let i = 0; i < num_elem; i++) { 
            citynamelist[i] = city.features[i].properties.cityname; //der Stadtname wird abgefragt und in eine eigene Liste geschrieben
            geg_city = new Point(city.features[i].geometry.coordinates[1], city.features[i].geometry.coordinates[0], citynamelist[i]) //aus der Cities-Datei werden die wichtigen Daten extrahiert (Koordinaten und Name)
            dist[i] = Math.round([compute_geographic_distance(geg_city, new_point, "km")*1000])/1000; //Für die bessere Lesbarkeit habe ich den Wert auf drei Stellen nach dem Komma gekürzt    
        }
        var indices_dist = [...dist.keys()] //Dist wird von klein nach groß sortiert, dabei merke ich mir hier die neue Reihnfolge der alten Indizes
        indices_dist.sort((a, b) => dist[a] - dist[b]);
        var dist_sorted = dist.sort((a, b) => a - b) //Neue Variable mit der sortierten Distanz
        var city_sorted = []
        for (let i = 0; i < num_elem; i++) {
            city_sorted[i] = citynamelist[indices_dist[i]] //Die Stadtnamen werden passend zu der nun sortierten Distanz zugeordnet
        }
    var dist_name_list = [city_sorted, dist_sorted]  
    return dist_name_list
    }