// Wait for the DOM content to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", async function () {

    // Initialize the map
    const map = initializeMap();
    // Create marker cluster groups for mosques, carparks, and musollas
    const mosqueCluster = createMarkerClusterGroup();
    const carparkCluster = createMarkerClusterGroup();
    const musollaCluster = createMarkerClusterGroup();

    // Add markers for mosques, carparks, and musollas to the map
    addMosquesToMap(map, mosqueCluster);
    addCarparksToMap(map, carparkCluster);
    addMusollasToMap(map, musollaCluster);

    // Closure - Add layer controls to the map
    // `function` creates a closure around the `addLayerControls` function, 
    // allowing it to access the map variable and its parameters(mosqueCluster, carparkCluster, musollaCluster), 
    // while ensuring that these variables are not accessible from the global scope.
    (function() {
        // Add layer control for mosques, carparks, and musollas
        const layerControl = L.control.layers(null, {
            'Mosques': mosqueCluster,
            'Carparks': carparkCluster,
            'Musollas': musollaCluster
        }).addTo(map);

        // Check if the mosque cluster is already added to the map
        map.hasLayer(mosqueCluster) ? layerControl.addOverlay(mosqueCluster, 'Mosques') : null;
        // Check if the carpark cluster is already added to the map
        map.hasLayer(carparkCluster) ? layerControl.addOverlay(carparkCluster, 'Carparks') : null;
        // Check if the musolla cluster is already added to the map
        map.hasLayer(musollaCluster) ? layerControl.addOverlay(musollaCluster, 'Musollas') : null;
    })();

    // Add geocoding control for searching locations
    addGeocodingControl(map);
    // Add location control for showing current location
    addLocationControl(map);
    // Add leaflet search control for searching mosques, carparks, musollas
    addLeafletSearchControl(map, mosqueCluster, carparkCluster, musollaCluster);
    // Show current location of the user
    showCurrentLocation(map);
    // Add routing control for displaying routes
    addRoutingControl(map);
    // Add fly to control for flying to a specific location
    addFlyToControl(map);

    // Function to initialize the map
    function initializeMap() {
        const map = L.map("singaporeMap").setView([1.3521, 103.8198], 13);
        // Add OpenStreetMap tiles as the base layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        return map;
    }

    // Function to create a marker cluster group
    function createMarkerClusterGroup() {
        return L.markerClusterGroup();
    }

    // Function to add markers for mosques to the map
    async function addMosquesToMap(map, clusterGroup) {
        // Fetch mosque data from mosques.json
        const mosquesResponse = await axios.get("mosques.json");
        // Add markers for each mosque to the cluster group
        for (let mosque of mosquesResponse.data.mosques) {
            const popupContent = createPopupContent(mosque);
            const marker = createMarker(mosque.location.latitude, mosque.location.longitude, popupContent, 'images/mosqueicon.png');
            clusterGroup.addLayer(marker);
        }
        // Add the cluster group to the map
        map.addLayer(clusterGroup);
    }

    // Function to add markers for carparks to the map
    async function addCarparksToMap(map, clusterGroup) {
        // Fetch carpark data from carparks.json
        const carparksResponse = await axios.get('carparks.json');
        // Add markers for each carpark to the cluster group
        for (let carpark of carparksResponse.data.carparks) {
            const popupContent = `
                <h1>${carpark.carpark_no}</h1>
                <p>${carpark.address}</p>
            `;
            const marker = createMarker(carpark.location.latitude, carpark.location.longitude, popupContent, 'images/carparkicon.png');
            clusterGroup.addLayer(marker);
        }
        // Add the cluster group to the map
        map.addLayer(clusterGroup);
    }

    // Function to add markers for musollas to the map
    async function addMusollasToMap(map, clusterGroup) {
        // Fetch musolla data from musollas.json
        const musollasResponse = await axios.get('musollas.json');

        // Arrow Function - sort musollas by name alphabetically before adding them to the map
        // sorts the array of musollas based on their Location property alphabetically
        musollasResponse.data.musollas.sort((a, b) => a.Location.localeCompare(b.Location));

        // Add markers for each musolla to the cluster group
        for (let musolla of musollasResponse.data.musollas) {
            // Parse latitude and longitude
            const latitude = parseFloat(musolla.Latitude);
            const longitude = parseFloat(musolla.Longitude);

            // Check if latitude and longitude are valid numbers
            if (!isNaN(latitude) && !isNaN(longitude)) {
                const popupContent = `
                <h1>${musolla.Location}</h1>
                <p><strong>Address:</strong> ${musolla.Address}, ${musolla['Postal Code']}</p>
            `;
                const marker = createMarker(latitude, longitude, popupContent, 'images/musollasicon.png');
                clusterGroup.addLayer(marker);
            }
        }
        // Add the cluster group to the map
        map.addLayer(clusterGroup);
    }

    // Function to create popup content for mosque markers
    function createPopupContent(mosque) {
        return `
            <h1>${mosque.mosque}</h1>
            <a href="${mosque.website}" target="_blank">
                <img src="${mosque.photo}" alt="${mosque.name} Photo" style="max-width: 200px;">
            </a>
            <p><strong>Address:</strong> ${mosque.address}</p>
            <p><strong>Telephone:</strong> ${mosque.telephone}</p>
        `;
    }

    // Function to create a marker with popup
    function createMarker(latitude, longitude, popupContent, iconUrl) {
        // Create a marker with the specified icon
        const marker = L.marker([latitude, longitude], { icon: L.icon({ iconUrl: iconUrl, iconSize: [32, 32] }) });

        // Bind Popup to popupContent to marker
        marker.bindPopup(popupContent);

        // Event Handler - Arrow Function
        marker.on('mouseover', function () {
            this.openPopup();
        });

        // Event Handler
        marker.on('mouseout', function () {
            this.closePopup();
        });

        // Return the marker
        return marker;
    }

    // Function to add geocoding control to the map
    function addGeocodingControl(map) {
        // Add geocoding control using MapTiler
        L.Control.geocoder({
            geocoder: L.Control.Geocoder.mapTiler('hT5cbJbT4JHuFPq0wIq8')
        }).addTo(map);
    }

    // Function to add location control to the map
    function addLocationControl(map) {
        // Add location control to the map
        L.control.locate().addTo(map);
    }

    // Function to add leaflet search control to the map
    function addLeafletSearchControl(map, mosqueCluster, carparkCluster, musollaCluster) {
        // Combine all marker clusters into one layer group
        const allLayers = L.layerGroup([mosqueCluster, carparkCluster, musollaCluster]);

        // Create a Leaflet search control
        const searchControl = new L.Control.Search({
            // `allLayers` contain all the marker clusters
            layer: allLayers,
            propertyName: ['mosque', 'carparks', 'musollas'],
            marker: false,
            moveToLocation: function (latlng) {
                map.setView(latlng, 17);
            }
        });

        // Add the search control to the map
        searchControl.addTo(map);

        // Add zoom control to the map
        map.addControl(new L.Control.Zoom({ position: 'topright' }));

        // Adjust the layer order to ensure the search control is on top
        searchControl.getContainer().style.zIndex = 1001;
    }

    // Function to show current location on the map
    function showCurrentLocation(map) {
        navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError);

        function onLocationFound(e) {
            const radius = e.coords.accuracy;
            const me = L.marker([e.coords.latitude, e.coords.longitude], {
                icon: L.icon({ iconUrl: '/images/me.png', iconSize: [32, 32] })
            }).addTo(map);
            const circle = L.circle([e.coords.latitude, e.coords.longitude], radius).addTo(map);
            layerLocateMe.addTo(map);

            document.querySelector('#location-info').innerHTML = `
                <h2>Your Current Location:</h2>
                <p>Latitude: ${e.coords.latitude}</p>
                <p>Longitude: ${e.coords.longitude}</p>
            `;
        }

        // When the `navigator.geolocation.getCurrentPosition` function encounters an error, 
        // it calls the `onLocationError` function, and triggers the `Swal.fire` function to display an error message.
        function onLocationError(e) {
            Swal.fire({
                title: 'Error',
                text: 'Failed to retrieve your current location.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Function to add routing control to the map
    function addRoutingControl(map) {
        // Add routing control to the map
        L.Routing.control({
            waypoints: [
                L.latLng(1.3521, 103.8198),
                L.latLng(1.2956, 103.8590)
            ],
            routeWhileDragging: true
        }).addTo(map);
    }

    // Function to add fly to control to the map
    function addFlyToControl(map) {
        // Add fly to control to the map
        L.control.flyTo({ position: 'topright' }).addTo(map);
    }

    // Function to remove a specific layer from the map
    function removeLayer(map, layer) {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        } else {
            console.log("Layer not found on the map.");
        }
    }
});