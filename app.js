var createError = require('http-errors');
var path = require('path');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const fileUpload = require('express-fileupload');
const app = express();
const turf = require('@turf/turf');
const fs = require('fs');
const port = 5000;

// Create the Database
const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'mydb';
const collectionName = '6_Projekt';

// Sachsen-Grenzen laden
const sachsenGeoJson = JSON.parse(fs.readFileSync('./input_files/sachsen.geojson', 'utf8'));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Router erstellen
var impRoute = require('./routes/impressum');
app.use('/impressum', impRoute);
var mapRoute = require('./routes/map');
app.use('/map', mapRoute);

// Home-Verzeichnis
app.get('/', function(req, res) {
  res.render('home'); // No need for .pug extension
});

// ...

app.post('/', async (req, res) => {
  console.log('Receiving data...');

  let dataJson;
  let errorMessages = [];

  // Verarbeitung des Datei-Uploads
  if (req.files && req.files.input_data) {
    const input = req.files.input_data;
    const ftype = input.name.split('.').pop().toLowerCase();

    if (ftype !== "json" && ftype !== "geojson") {
      errorMessages.push('Die ausgewählte Datei ist keine (Geo-)JSON-Datei.');
    } else {
      const dataString = input.data.toString();
      try {
        dataJson = JSON.parse(dataString);
      } catch (err) {
        console.error('Invalid JSON file.');
        errorMessages.push('Die Datei enthält ungültiges JSON.');
      }
    }

    // Sicherstellen, dass die hochgeladene Datei ein gültiges GeoJSON-Format hat
    if (!dataJson || !dataJson.type || dataJson.type !== 'FeatureCollection' || !Array.isArray(dataJson.features)) {
      errorMessages.push('Invalid GeoJSON format.');
    }

  // Verarbeitung der Texteingabe
  } else if (req.body.input_data && typeof req.body.input_data === 'string') {
    const dataString = req.body.input_data;

    try {
      dataJson = JSON.parse(dataString);
    } catch (err) {
      console.error('Invalid JSON text.');
      errorMessages.push('Die Texteingabe enthält ungültiges JSON.');
    }

    // Sicherstellen, dass die Eingabe ein gültiges GeoJSON-Format hat
    if (!dataJson || !dataJson.type || dataJson.type !== 'FeatureCollection' || !Array.isArray(dataJson.features)) {
      errorMessages.push('Invalid GeoJSON format.');
    }

  // Verarbeitung der Formular-Daten
  } else if (req.body.name && req.body.latitude && req.body.longitude) {
    const { name, latitude, longitude } = req.body;

    if (!name.trim() || !latitude.trim() || !longitude.trim()) {
      errorMessages.push('Bitte füllen Sie alle Felder aus.');
    } else {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      // Prüfen, ob die Koordinaten in Sachsen liegen
      const sachsenBounds = {
        minLat: 50.1833,
        maxLat: 51.6833,
        minLon: 11.8833,
        maxLon: 15.0333
      };

      if (lat < sachsenBounds.minLat || lat > sachsenBounds.maxLat || lon < sachsenBounds.minLon || lon > sachsenBounds.maxLon) {
        errorMessages.push('Die Koordinaten liegen nicht in Sachsen.');
      } else {
        // Erstellen eines GeoJSON-Objekts aus den Formulardaten
        dataJson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lon, lat]
              },
              properties: {
                cityname: name,
                url: req.body.url || ''
              }
            }
          ]
        }
        console.log("Json Objekt der Formulareingabe: ", dataJson);
      }
    }
  } else {
    errorMessages.push('Keine gültigen Eingabedaten bereitgestellt.');
  }

    // Umbenennen von "Place name" zu "cityname"
    dataJson.features.forEach(feature => {
      if (feature.properties && feature.properties['Place name']) {
        feature.properties['cityname'] = feature.properties['Place name'];
        delete feature.properties['Place name'];
      }
    });

  if (errorMessages.length > 0) {
    console.log('Errors:', errorMessages);
    res.status(400).render('home', { errorMessages }); // Fehlermeldungen an die View übergeben
  } else {
    try {
      await save_data_to_db(dataJson);
      console.log('Daten wurden zur Datenbank hinzugefügt.');
    } catch (err) {
      console.error('Fehler beim Speichern der Daten in der Datenbank:', err);
      res.status(500).send('Fehler beim Speichern der Daten in der Datenbank.');
    }
  }
});

// ...


async function save_data_to_db(data) {
  console.log("Saving to database...");
  console.log(data);

  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const options = { ordered: true };
  const result = await collection.insertMany(data.features, options);
  console.log(`${result.insertedCount} documents were inserted in the collection`);
}

app.get('/data', async (req, res) => {
  const result = await get_data_from_db();
  const result_as_fc = turf.featureCollection(result);
  res.json(result_as_fc);
});

async function get_data_from_db() {
  await client.connect();
  console.log('Connected successfully to server');

  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  const cursor = collection.find({});
  const results = await cursor.toArray();

  if (results.length == 0) {
    console.log("No documents found!");
  } else {
    console.log(`Found ${results.length} documents in the collection...`);
  }
  return results;
}

app.listen(port, () => {
  console.log(`Projekt listening on port ${port}`);
});

// catch 404 and forward to error handler 
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
