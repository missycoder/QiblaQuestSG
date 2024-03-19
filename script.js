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
    (function () {
        // Add layer control for mosques, carparks, and musollas
        const layerControl = L.control.layers(null, {
            'Mosques': mosqueCluster,
            'Carparks': carparkCluster,
            'Musollas': musollaCluster
        }).addTo(map);

        // Select all elements representing layer controls and add them to the map
        const layerControls = document.querySelectorAll('.layer-control');
        // // Iterate over each layer control element
        layerControls.forEach(control => {
            // Get the layer name from the 'data-layer-name' attribute of the control element
            const layerName = control.getAttribute('data-layer-name');
            // Access the layer group by its variable name
            const layerGroup = window[layerName];
            // Add the layer to the layer control panel
            layerControl.addOverlay(layerGroup, layerName);
        });
    })();

    // Add geocoding control for searching locations
    // addGeocodingControl(map);
    // Add location control for showing current location
    // addLocationControl(map);
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
    // Data Validation - `try-catch` error during the fetching and adding of data for carparks 
    async function addCarparksToMap(map, clusterGroup) {
        try {
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

                // Add `mouseover` and `mouseout` events only to carparks markers
                marker.on('mouseover', function () {
                    this.openPopup();
                });

                marker.on('mouseout', function () {
                    this.closePopup();
                });
            }
            // Add the cluster group to the map
            map.addLayer(clusterGroup);
        } catch (error) {
            console.error('Error adding carparks to map:', error);
            // Display an error message to the user
            Swal.fire({
                title: 'Error',
                text: 'Failed to load carpark data.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }

    // Function to add markers for musollas to the map
    // Data Validation - `try-catch` error during the fetching and adding of data for musollas
    async function addMusollasToMap(map, clusterGroup) {
        try {
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

                // Data Validation - Check if latitude and longitude are valid numbers
                // before adding markers for `musollas` to the cluster group.
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
        } catch (error) {
            console.error('Error adding musollas to map:', error);
            // Display an error message to the user
            Swal.fire({
                title: 'Error',
                text: 'Failed to load musolla data.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
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

        // Return the marker
        return marker;
    }


    // SEARCH BUTTON
    async function search(lat, lng, searchTerms) {
        try {
            const response = await axios.get('mosques.json');
            const searchData = response.data.mosques.mosque(mosque => {
                return mosque.name.toLowerCase().includes(searchTerms.toLowerCase());
            });
            return searchData;
        } catch (error) {
            console.error('Error during search:', error);
            // Rethrow the error to propagate it
            throw error; 
        }
    }

    document.querySelector("#searchBtn").addEventListener("click", async function () {
        try {
            const searchTerms = document.querySelector("#searchTerms").value;

            // Find the lat lng of the center of the map
            const centerPoint = map.getBounds().getCenter();
            const searchData = await search(centerPoint.lat, centerPoint.lng, searchTerms);

            // Clear existing markers before adding new ones
            searchLayer.clearLayers();

            // Adding markers to the map for the search results
            addMarkersToMap(searchData, searchLayer, map);
        } catch (error) {
            console.error('Error during search:', error);
        }
    });


    document.querySelector("#toggleSearchBtn").addEventListener("click", function () {

        const searchContainer = document.querySelector("#search-container");
        const style = window.getComputedStyle(searchContainer);
        // if the search container is already visible, we'll hide it
        if (style.display != "none") {
            searchContainer.style.display = "none";
        } else {
            // otherwise, show it
            searchContainer.style.display = 'block';
        }
    })


    async function search(lat, lng, searchTerms) {
        const response = await axios.get('mosques.json')
        return response.data;
    };






    // // Function to add geocoding control to the map [API]
    // function addGeocodingControl(map) {
    //     // Add geocoding control using MapTiler
    //     L.Control.geocoder({
    //         geocoder: L.Control.Geocoder.mapTiler('hT5cbJbT4JHuFPq0wIq8')
    //     }).addTo(map);
    // }

    // Function to add location control to the map
    function addLocationControl(map) {
        // Add location control to the map
        // L.control.locate().addTo(map);
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

    // Hadith quotes array
    const hadithQuotes = [
        "The best of you are those who are best to their families. - Sahih Bukhari",
        "Speak good or remain silent. - Sunan al-Tirmidhi",
        "None of you truly believes until he loves for his brother what he loves for himself. - Sahih Bukhari",
        "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry. - Sahih al-Bukhari",
        "The most beloved of deeds to Allah are those that are most consistent, even if they are small. - Sahih Bukhari",
        "Do not be people without minds of your own, saying that if others treat you well you will treat them well and that if they do wrong you will do wrong. But (instead) accustom yourselves to do good if people do good and not to do wrong if they do evil. - Sunan al-Tirmidhi",
        "Kindness is a mark of faith, and whoever has no kindness has no faith. - Sahih Muslim",
        "Whoever does not show mercy to our young ones and respect to our elders is not one of us. - Sunan al-Tirmidhi",
        "The best of people are those who are most beneficial to people. - Sunan al-Tirmidhi",
        "Do not belittle any good deed, even meeting your brother with a cheerful face. - Sahih Muslim"
    ];

    // Function to get a random Hadith quote
    function getRandomHadithQuote() {
        const randomIndex = Math.floor(Math.random() * hadithQuotes.length);
        return hadithQuotes[randomIndex];
    }

    // Function to render Hadith quotes
    function renderHadithQuote() {
        const hadithQuotesElement = document.getElementById('hadithQuotes');
        hadithQuotesElement.textContent = getRandomHadithQuote();
    }

    // Initial rendering of Hadith quote
    renderHadithQuote();

    // Set interval to rotate quotes every 10 seconds (10000 milliseconds)
    setInterval(renderHadithQuote, 10000);

});
