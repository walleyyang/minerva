agGrid.initialiseAgGridWithAngular1(angular)

let minerva = angular.module('minerva', ['agGrid'])

minerva.controller('news', function($scope, $http) {
    $scope.people = 0
    $scope.organizations = 0
    $scope.data = {}

    let url = '/api/news'
    let getNews = $http.get(url)
                    .then(function(response) {
                        $scope.data = response.data
                        $scope.countEntities($scope.data)
                        displayLeaflet($scope.data)
                        
                        let gridData = getGridData($scope.data)
                        $scope.gridOptions.api.setRowData(gridData)
                            

                    }, function(error) {
                        console.log('An error occured while getting the news data.')
                    })
    
    $scope.countEntities = function(data) {
        for(let value of data) {
            $scope.people += value.PERSON.length
            $scope.organizations += value.ORG.length
        }
    }

    $scope.gridOptions = {
        columnDefs: [
            {headerName: "Entity", field: "entity", width: 100},
            {headerName: "Value", field: "value", width: 250},
            {headerName: "Tweets", field: "tweets", width: 80},
            {headerName: "Source", field: "source"},
            {headerName: "Article Url", field: "url", width: 350, cellRenderer: function(params){ return params.value ? params.value: ''}}
        ],
        rowData: []
    }

})

function getGridData(data) {
    let rowData = []
    let gridObject = {}

    for(let value of data) {
        let personLength = value.PERSON.length
        let orgLength = value.ORG.length
        
        for(let i = 0; personLength > i; i++) {
            gridObject = {
                entity: "Person",
                value: value.PERSON[i],
                tweets: "999",
                source: value.sourceName,
                url: "<a href=\"" + value.url + "\" target=\"_blank\">" + value.title + "</a>"
            }

            rowData.push(gridObject)
        }

        for(let i = 0; orgLength > i; i++) {
            gridObject = {
                entity: "Organization",
                value: value.ORG[i],
                tweets: "8888",
                source: value.sourceName,
                url: "<a href=\"" + value.url + "\" target=\"_blank\">" + value.title + "</a>"
                
            }

            rowData.push(gridObject)
        }
        
    }

    return rowData
}

function displayLeaflet(data) {
    let articles = []
    let geoObject

    for(let value of data) {
        let coordinateLength = value.coordinates.length

        if(coordinateLength > 0) {
            for(let i = 0; coordinateLength > i; i++) {
                let lat = value.coordinates[i][0]
                let long = value.coordinates[i][1]

                geoObject = {
                    "type": "Feature",
                    "properties": {
                        "url": value.url,
                        "description": value.description,
                        "title": value.title,
                        "sourceName": value.sourceName,
                        "publishedDateTime": value.publishedDateTime
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [long, lat]
                    }
                }

                articles.push(geoObject)
            }
        }
    }

    let map = L.map('map').setView([0, 0], 2)
    let markers = L.markerClusterGroup()
    let geoJSONLayer = L.geoJSON(articles, {
        onEachFeature: function(feature, layer) {
            layer.bindPopup(
                "<b>" + feature.properties.title + "</b><br />" +
                feature.properties.sourceName + " <br />" + 
                "Published: " + feature.properties.publishedDateTime + "<br />" +
                feature.properties.description + "<br />" +
                "<a href=\"" + feature.properties.url + "\" target=\"_blank\">" + feature.properties.url + "</a><br />"
            )
        }
    })
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    markers.addLayer(geoJSONLayer)
    map.addLayer(markers)
}
