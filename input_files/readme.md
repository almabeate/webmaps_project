Data for the project work for the course Webbasierte Karten und WebGIS at TU Dresden (SoSe 2024). The data features: 
* Five datasets for which the application should produce an error message: empty.json (empty file), invalid_1.json (inappropriate content), invalid_2.json (ill-formated json), invalid_3.json (the data includes only one place, which is outside Saxony), invalid_4.json (the data includes several places, of which one is outside Saxony)
* places_in_saxony.json and places_in_saxony.geojson, which show examples of places in Saxony (the only difference between the two datasets is the file extension, else the content is exactly the same). The application should accept both files
* dresden.json for the coordinates of Dresden
* sachsen.json for the boundaries of the state of Saxony
  
Coordinates of places are crude approximations (e.g. points instead of polygons), taken from the respective Wikipedia articles, for the purpose of the exercise only.

Weather API link for the current weather information: https://openweathermap.org/current

Weather API link for the 30 day forecast: https://openweathermap.org/api/forecast30
