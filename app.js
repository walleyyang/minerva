/*
 @author: Walley Yang
*/

require('./api/data/dbConnection.js').open()
let express = require('express')
let app = express()

let routes = require('./api/routes') 

app.use(express.static(__dirname + '/app'))

app.use('/api', routes)

// Static routes for node modules
app.use('/assets/jquery', express.static(__dirname + '/node_modules/jquery/dist/'))
app.use('/assets/popper', express.static(__dirname + '/node_modules/popper.js/dist/'))
app.use('/assets/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'))
app.use('/assets/angular', express.static(__dirname + '/node_modules/angular/'))
app.use('/assets/ag-grid', express.static(__dirname + '/node_modules/ag-grid/dist/'))
app.use('/assets/leaflet', express.static(__dirname + '/node_modules/leaflet/dist/'))
app.use('/assets/leaflet-markercluster', express.static(__dirname + '/node_modules/leaflet.markercluster/dist/'))

app.listen(8888, () => console.log('Server running on port 8888.'))
