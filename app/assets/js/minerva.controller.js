agGrid.initialiseAgGridWithAngular1(angular)

let minerva = angular.module('minerva', ['agGrid'])
let tweets = []

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
                        
                        displayTweets(tweets[0][0]["news_id"], tweets[0][0]["query"])

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
            {headerName: "Tweets", field: "tweets", width: 100, cellRenderer: function(params){ return params.value ? params.value: ''}, sort:['desc']},
            {headerName: "Source", field: "source"},
            {headerName: "Article Url", field: "url", width: 350, cellRenderer: function(params){ return params.value ? params.value: ''}}
        ],
        rowData: [],
        enableSorting: true,
        sortingOrder: ['desc', 'asc', null]
    }
})

function getGridData(data) {
    let rowData = []
    let gridObject = {}
    let tempTweets = []

    for(let value of data) {
        let personLength = value.PERSON.length
        let orgLength = value.ORG.length
        let twitterSearch = value.twitter["search_metadata"];
        let twitterStatuses = value.twitter["statuses"];
        let news = value.twitter["news"]

        twitterStatuses.unshift(news)
        tempTweets.push(twitterStatuses)
        
        if(personLength > 0) {
            for(let i = 0; personLength > i; i++) {
                let person = value.PERSON[i]
                let count = getTwitterCount(person, value.twitter)
                let link = count == 0 ? '<a href="#" onClick=\'alert("No Tweets Available")\'>0</a>' : '<a href="#" onClick=\'displayTweets("'+ news.news_id +'","'+ person +'")\'>'+ count +'</a>'
                gridObject = {
                    entity: "Person",
                    value: person,
                    tweets: link,
                    source: value.sourceName,
                    url: "<a href=\"" + value.url + "\" target=\"_blank\">" + value.title + "</a>"
                }

                rowData.push(gridObject)
            }
        }

        if(orgLength > 0) {
            for(let i = 0; orgLength > i; i++) {
                let org = value.ORG[i]
                let count = getTwitterCount(org, value.twitter)
                let link = count == 0 ? '<a href="#" onClick=\'alert("No Tweets Available")\'>0</a>' : '<a href="#" onClick=\'displayTweets("'+ news.news_id +'","'+ org +'")\'>'+ count +'</a>'
                gridObject = {
                    entity: "Organization",
                    value: value.ORG[i],
                    tweets: link,
                    source: value.sourceName,
                    url: "<a href=\"" + value.url + "\" target=\"_blank\">" + value.title + "</a>"
                    
                }

                rowData.push(gridObject)
            }
        }
        
    }

    tweets = uniqueTweets(tempTweets)

    return rowData
}

function getTwitterCount(entity, twitter) {
    let count = 0

    if(twitter["news"]["query"] == entity) {
        count = twitter["search_metadata"]["count"]
    }
    
    return count
}

function uniqueTweets(twitter) {
    let temps = twitter
    let cleaned = []
    let checked = false

    for(let tweet of twitter) {
        let tweetQuery = tweet[0]["query"]

        for(let temp of temps) {
            let tempQuery = temp[0]["query"]
    
            if(!checked && tweetQuery != tempQuery) {
                cleaned.push(temp)

                checked = true
            }

            if(checked) {
                temps.splice(temps.indexOf(temp), 1)
            }
        }

        checked = false
    }

    return cleaned
}

function displayTweets(newsId, query) {
    // Should really be doing this with Angular
    for(let tweet of tweets) {
        let tweetNewsId = tweet[0].news_id
        let tweetNewsQuery = tweet[0].query

        if(tweetNewsId == newsId) {
            let div = ''
            
            for(let i = 2; i < tweet.length; i++) {
                let profileImage = tweet[i]["user"].profile_image_url
                let screenName = tweet[i]["user"].screen_name
                let date = tweet[i]["created_at"]
                let text = tweet[i]["text"]

                div += 
                '<div class="tweet">'+
                    '<img src="'+ profileImage +'" /><br />'+
                    '<span class="twitter_screen_name">'+ screenName +'</span><br />'+
                    '<span class="twitter_date">Date: '+ date + '</span><br />'+
                    '<span class="twitter_text">'+ text +'</span>'+
                '</div>'
            }

            document.getElementById("twitter").innerHTML = div

            break
        }
    }
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
