$(document).ready(function () {

    const api_key = "YOUR_API_KEY";
    var startPosition = null;
    var destinationPosition = null;


    // This function decorates the route calculation by setting markers at the start and destination at the map.
    function setMarkers() {
        // Here the old markers of the previous calculation are deleted.
        removeAllMarkers(map);
        // The new markers are set.
        L.marker(startPosition).addTo(map);
        L.marker(destinationPosition).addTo(map);
    }

    function geocodeAdress(searchText, action) {
        // Define the parameters needed for the REST query. See https://developer.myptv.com/Documentation/Geocoding%20API/API%20Reference.htm
        fetch(`https://api.myptv.com/geocoding/v1/locations/by-text?searchText=${searchText}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "apiKey": api_key
                }
            })
            .then(response => response.json()
                .then(result => {
                    action(result.locations[0].referencePosition);
            }))
            .catch(ex => {
                alert(ex.message);
            });
    }


    function fetchRoute() {
        fetch(
            `https://api.myptv.com/routing/v1/routes?waypoints=${startPosition[0].toString()},${startPosition[1].toString()}&waypoints=${destinationPosition[0].toString()},${destinationPosition[1].toString()}&results=POLYLINE&options[trafficMode]=AVERAGE`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "apiKey": api_key
                }
            })
            .then(response => response.json()
                .then(result => {
                    document.getElementById("travelResult").innerHTML = convertTime(result.travelTime) + ' for ' + convertDistance(result.distance);
                    displayPolyline(map, JSON.parse(result.polyline));

                }))
            .catch(ex => {
                alert(ex.message);
            });

    }

    $("#btnSubmit").click(function () {
        try {
            geocodeAdress($("#startFormId").val(), (coord) => {
                // Extract the start position from the response.
                startPosition = [coord.latitude, coord.longitude];
                geocodeAdress($("#destinationFormId").val(), (coord) => {
                    // Extract the start position from the response.     
                    destinationPosition = [coord.latitude, coord.longitude];
                    setMarkers();
                    // This function calls the Routing API to get the calculated route.
                    fetchRoute();
                });
            });
        } catch (ex) {
            alert(ex.message);
        }
    });

    var coordinate = L.latLng(49, 8.4);

    var map = new L.Map('map', {
        center: coordinate,
        zoom: 13,
        zoomControl: false
    });

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    var tileLayer = new L.tileLayer(
        "https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?size={tileSize}",
        {
            attribution: "© " + new Date().getFullYear() + ", PTV Group, HERE",
            tileSize: 256,
            trackResize: false,
        },
        [
            { header: "apiKey", value: api_key },
        ]).addTo(map);
});


function removeAllMarkers(map) {
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            layer.remove();
        }
    });
}

var polylineLayer = null;

function displayPolyline(map, poly) {
    if (polylineLayer !== null) {
        map.removeLayer(polylineLayer);
    }

    var myStyle = {
        "color": '#2882C8',
        "weight": 5,
        "opacity": 0.65
    };

    polylineLayer = L.geoJSON(poly, {
        style: myStyle
    }).addTo(map);

    map.fitBounds(polylineLayer.getBounds());
}