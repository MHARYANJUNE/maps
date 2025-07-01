// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after a brief delay for smooth experience
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.visibility = 'hidden';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }, 1500);
    
    // Initialize the map centered on a location (latitude, longitude)
    const map = L.map('map').setView([51.505, -0.09], 13);
    
    // Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker at the center point
    const marker = L.marker([51.505, -0.09]).addTo(map);
    
    // Replace the default popup with a modern welcome message
    marker.bindPopup(`
        <div class="custom-popup">
            <h3><i class="fas fa-rocket"></i> Welcome to Interactive Map Pro!</h3>
            <p>🎯 <strong>Ready to explore?</strong> Your advanced mapping experience starts here!</p>
            <div style="margin: 16px 0;">
                <p style="margin: 8px 0;"><i class="fas fa-mouse-pointer" style="color: #00d2ff;"></i> <strong>Click anywhere</strong> to add markers</p>
                <p style="margin: 8px 0;"><i class="fas fa-location-arrow" style="color: #4cc9f0;"></i> <strong>Use controls</strong> to navigate</p>
                <p style="margin: 8px 0;"><i class="fas fa-route" style="color: #f72585;"></i> <strong>Plan routes</strong> between locations</p>
                <p style="margin: 8px 0;"><i class="fas fa-cog" style="color: #f8961e;"></i> <strong>Customize</strong> your experience</p>
            </div>
            <div class="popup-actions">
                <button id="welcome-start-btn" class="popup-btn">
                    <i class="fas fa-play"></i> Let's Go!
                </button>
            </div>
        </div>
    `).openPopup();
    
    // Add event listener for the welcome button
    setTimeout(() => {
        const welcomeBtn = document.getElementById('welcome-start-btn');
        if (welcomeBtn) {
            welcomeBtn.addEventListener('click', function() {
                map.closePopup();
                showToast("Let's start mapping!", 'success');
            });
        }
    }, 100);
    
    // Store all created markers for later management
    const userMarkers = [];
    
    // Available marker icons
    const markerIcons = {
        default: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        red: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        green: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        gold: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        blue: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        start: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        }),
        end: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    };
    
    // Variable to track modes
    let markerPlacementMode = false;
    let routingMode = false;
    let routeStart = null;
    let routeEnd = null;
    let routingControl = null;
    let userLocation = null;
    let currentMarkerIcon = markerIcons.default;
    let tempMarker = null; // For position preview
    let tempRouteMarker = null; // For route point confirmation
    
    // Store route markers for later access
    let routeStartMarker = null;
    let routeEndMarker = null;

    // Function to create a detailed marker popup with title and image
    function createDetailedPopup(title, description, imageUrl, marker) {
        let popupContent = `<div class="custom-popup">`;
        
        if (title) {
            popupContent += `<h3>${title}</h3>`;
        }
        
        if (imageUrl) {
            popupContent += `<img src="${imageUrl}" alt="${title}" style="max-width:100%; max-height:150px; margin:5px 0;">`;
        }
        
        if (description) {
            popupContent += `<p>${description}</p>`;
        }
        
        // Add edit and delete buttons
        popupContent += `
            <div class="popup-actions" style="margin-top: 10px;">
                <button id="edit-marker-btn" class="popup-btn" style="background-color: var(--primary);">✏️ Edit</button>
                <button id="remove-marker-btn" class="popup-btn" style="background-color: var(--danger);">🗑️ Remove</button>
            </div>
        `;
        
        popupContent += `</div>`;
        return popupContent;
    }
    
    // Add toast notification system
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Remove the toast after duration
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
    
    // Function to prompt for marker details using modern UI
    async function promptForMarkerDetails() {
        const { value: formValues } = await Swal.fire({
            title: '<i class="fas fa-map-marker-alt"></i> Create New Marker',
            html: `
                <div style="text-align: left;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-tag"></i> Title
                        </label>
                        <input id="marker-title" class="swal2-input" placeholder="Enter marker title" value="My Location" style="margin: 0; width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-align-left"></i> Description
                        </label>
                        <textarea id="marker-desc" class="swal2-textarea" placeholder="Enter description (optional)" style="margin: 0; width: 100%; height: 80px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-image"></i> Image URL
                        </label>
                        <input id="marker-image" class="swal2-input" placeholder="Enter image URL (optional)" style="margin: 0; width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-palette"></i> Marker Color
                        </label>
                        <select id="marker-color" class="swal2-select" style="margin: 0; width: 100%;">
                            <option value="default">🔵 Default (Blue)</option>
                            <option value="red">🔴 Red</option>
                            <option value="green">🟢 Green</option>
                            <option value="gold">🟡 Gold</option>
                            <option value="blue">🔵 Blue</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-plus"></i> Create Marker',
            cancelButtonText: '<i class="fas fa-times"></i> Cancel',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            customClass: {
                popup: 'modern-popup'
            },
            width: '500px',
            preConfirm: () => {
                const title = document.getElementById('marker-title').value;
                const description = document.getElementById('marker-desc').value;
                const imageUrl = document.getElementById('marker-image').value;
                const iconType = document.getElementById('marker-color').value;
                
                if (!title.trim()) {
                    Swal.showValidationMessage('Title is required');
                    return false;
                }
                
                return {
                    title: title.trim(),
                    description: description.trim(),
                    imageUrl: imageUrl.trim(),
                    icon: markerIcons[iconType] || markerIcons.default
                };
            }
        });

        if (formValues) {
            showToast("Marker created successfully!", "success");
            return formValues;
        }
        return null;
    }

    // Function to edit marker details with modern UI
    async function editMarkerDetails(marker) {
        const currentPopup = marker.getPopup().getContent();
        const titleMatch = currentPopup.match(/<h3>(.*?)<\/h3>/);
        const descMatch = currentPopup.match(/<p>(.*?)<\/p>/);
        const imgMatch = currentPopup.match(/src="(.*?)"/);
        
        const currentTitle = titleMatch ? titleMatch[1] : '';
        const currentDesc = descMatch ? descMatch[1] : '';
        const currentImg = imgMatch ? imgMatch[1] : '';
        
        const { value: formValues } = await Swal.fire({
            title: '<i class="fas fa-edit"></i> Edit Marker',
            html: `
                <div style="text-align: left;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-tag"></i> Title
                        </label>
                        <input id="edit-title" class="swal2-input" placeholder="Enter marker title" value="${currentTitle}" style="margin: 0; width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-align-left"></i> Description
                        </label>
                        <textarea id="edit-desc" class="swal2-textarea" placeholder="Enter description (optional)" style="margin: 0; width: 100%; height: 80px; resize: vertical;">${currentDesc}</textarea>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-image"></i> Image URL
                        </label>
                        <input id="edit-image" class="swal2-input" placeholder="Enter image URL (optional)" value="${currentImg}" style="margin: 0; width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff;">
                            <i class="fas fa-palette"></i> Marker Color
                        </label>
                        <select id="edit-color" class="swal2-select" style="margin: 0; width: 100%;">
                            <option value="default">🔵 Default (Blue)</option>
                            <option value="red">🔴 Red</option>
                            <option value="green">🟢 Green</option>
                            <option value="gold">🟡 Gold</option>
                            <option value="blue">🔵 Blue</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> Save Changes',
            denyButtonText: '<i class="fas fa-trash"></i> Delete Marker',
            cancelButtonText: '<i class="fas fa-times"></i> Cancel',
            confirmButtonColor: '#667eea',
            denyButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            customClass: {
                popup: 'modern-popup'
            },
            width: '500px',
            preConfirm: () => {
                const title = document.getElementById('edit-title').value;
                const description = document.getElementById('edit-desc').value;
                const imageUrl = document.getElementById('edit-image').value;
                const iconType = document.getElementById('edit-color').value;
                
                if (!title.trim()) {
                    Swal.showValidationMessage('Title is required');
                    return false;
                }
                
                return {
                    title: title.trim(),
                    description: description.trim(),
                    imageUrl: imageUrl.trim(),
                    iconType: iconType
                };
            }
        });

        if (formValues) {
            // Update marker
            if (formValues.iconType in markerIcons) {
                marker.setIcon(markerIcons[formValues.iconType]);
            }
            
            const popupContent = createDetailedPopup(formValues.title, formValues.description, formValues.imageUrl);
            marker.setPopupContent(popupContent);
            
            showToast("Marker updated successfully!", "success");
            return true;
        } else if (formValues === false) {
            // Delete marker was clicked
            const confirmDelete = await Swal.fire({
                title: 'Delete Marker?',
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, delete it!',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff'
            });
            
            if (confirmDelete.isConfirmed) {
                map.removeLayer(marker);
                const index = userMarkers.indexOf(marker);
                if (index > -1) {
                    userMarkers.splice(index, 1);
                }
                showToast("Marker deleted successfully!", "success");
            }
        }
        
        return false;
    }
    
    // Function to remove a marker
    async function removeMarker(marker) {
        const confirmResult = await Swal.fire({
            title: 'Remove Marker?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, remove it!',
            cancelButtonText: 'Cancel',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff'
        });
        
        if (confirmResult.isConfirmed) {
            map.removeLayer(marker);
            const index = userMarkers.indexOf(marker);
            if (index > -1) {
                userMarkers.splice(index, 1);
            }
            showToast("Marker removed", "warning");
            return true;
        }
        return false;
    }
    
    // Function to create a marker with standard controls
    function createUserMarker(latlng, markerDetails) {
        // Create marker with dragging enabled
        const newMarker = L.marker(latlng, {
            icon: markerDetails.icon,
            draggable: true,
            title: markerDetails.title
        }).addTo(map);
        
        // Create popup content
        const popupContent = createDetailedPopup(
            markerDetails.title, 
            markerDetails.description, 
            markerDetails.imageUrl
        );
        
        // Add popup with controls for editing and removing
        const popup = L.popup().setContent(popupContent);
        newMarker.bindPopup(popup);
        
        // Add event listener for popup open to attach button handlers
        newMarker.on('popupopen', function() {
            // Add click handlers to the buttons after the popup is opened
            setTimeout(() => {
                const editBtn = document.getElementById('edit-marker-btn');
                const removeBtn = document.getElementById('remove-marker-btn');
                
                if (editBtn) {
                    editBtn.addEventListener('click', async function() {
                        map.closePopup();
                        await editMarkerDetails(newMarker);
                    });
                }
                
                if (removeBtn) {
                    removeBtn.addEventListener('click', async function() {
                        map.closePopup();
                        await removeMarker(newMarker);
                    });
                }
            }, 10);
        });
        
        // Add to user markers array
        userMarkers.push(newMarker);
        
        // Add right-click context menu to marker for routing, editing, removing
        newMarker.on('contextmenu', async function(evt) {
            L.DomEvent.preventDefault(evt);
            
            const { value: action } = await Swal.fire({
                title: '<i class="fas fa-mouse-pointer"></i> Marker Actions',
                html: `
                    <div style="text-align: left; color: #ffffff;">
                        <p style="margin-bottom: 16px;">Choose an action for this marker:</p>
                        <div style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 8px;">
                                <input type="radio" name="action" value="route" style="margin-right: 8px;">
                                <i class="fas fa-route" style="margin-right: 8px; color: #00d2ff;"></i>
                                Route from my location
                            </label>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 8px;">
                                <input type="radio" name="action" value="edit" style="margin-right: 8px;">
                                <i class="fas fa-edit" style="margin-right: 8px; color: #4cc9f0;"></i>
                                Edit marker
                            </label>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="action" value="remove" style="margin-right: 8px;">
                                <i class="fas fa-trash" style="margin-right: 8px; color: #ff416c;"></i>
                                Remove marker
                            </label>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-check"></i> Proceed',
                cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#6c757d',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                width: '450px',
                preConfirm: () => {
                    const selectedAction = document.querySelector('input[name="action"]:checked');
                    if (!selectedAction) {
                        Swal.showValidationMessage('Please select an action');
                        return false;
                    }
                    return selectedAction.value;
                }
            });
            
            if (action === "route") {
                if (userLocation) {
                    createRoute(userLocation, newMarker.getLatLng());
                } else {
                    showToast("Your location is not available. Please use the locate button first.", "warning", 4000);
                }
            } else if (action === "edit") {
                await editMarkerDetails(newMarker);
            } else if (action === "remove") {
                await removeMarker(newMarker);
            }
        });
        
        // Add drag events
        newMarker.on('dragstart', function(event) {
            map.closePopup(); // Close popup when starting to drag
        });
        
        newMarker.on('dragend', function(event) {
            // Update the popup after dragging
            newMarker.openPopup();
        });
        
        return newMarker;
    }

    // Modified clear route function to also clear markers
    function clearRoute() {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
        
        // Clear route markers
        if (routeStartMarker) {
            map.removeLayer(routeStartMarker);
            routeStartMarker = null;
        }
        if (routeEndMarker) {
            map.removeLayer(routeEndMarker);
            routeEndMarker = null;
        }
        
        // Clear any temporary route markers
        if (tempRouteMarker) {
            map.removeLayer(tempRouteMarker);
            tempRouteMarker = null;
        }
        
        routeStart = null;
        routeEnd = null;
    }

    // Function to create a route
    function createRoute(start, end) {
        // Clear any existing route
        clearRoute();
        
        // Create a new routing control
        routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(end.lat, end.lng)
            ],
            routeWhileDragging: true,
            showAlternatives: true,
            altLineOptions: {
                styles: [
                    {color: 'black', opacity: 0.15, weight: 9},
                    {color: 'white', opacity: 0.8, weight: 6},
                    {color: '#4361ee', opacity: 0.7, weight: 4} // Updated to match theme
                ]
            }
        }).addTo(map);
        
        routingControl.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            showToast(`Route found: ${(summary.totalDistance / 1000).toFixed(1)} km, ${Math.round(summary.totalTime / 60)} min`, "success");
        });
    }
    
    // Modified click event for the map - enhance the popup with modern icons
    map.on('click', async function(e) {
        if (markerPlacementMode) {
            // First, show a temporary marker at the clicked position
            if (tempMarker) {
                map.removeLayer(tempMarker); // Remove any existing temp marker
            }
            
            // Create a temporary marker with a different style
            tempMarker = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'temp-marker',
                    html: '<div style="border-radius:50%;width:14px;height:14px;border:3px solid red;background-color:rgba(255,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            
            // Ask user to confirm the position with modern dialog
            const confirmResult = await Swal.fire({
                title: 'Confirm Position',
                text: `Place marker at coordinates: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, place marker',
                cancelButtonText: 'Cancel',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff'
            });
            
            if (confirmResult.isConfirmed) {
                // User confirmed position - now get marker details
                const markerDetails = await promptForMarkerDetails();
                
                if (markerDetails) {
                    // Remove temporary marker
                    map.removeLayer(tempMarker);
                    tempMarker = null;
                    
                    // Create the actual marker
                    createUserMarker(e.latlng, markerDetails);
                } else {
                    // User canceled details entry, remove temp marker
                    map.removeLayer(tempMarker);
                    tempMarker = null;
                }
            } else {
                // User did not confirm position, remove temp marker
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
        } else if (routingMode) {
            // Remove any temporary markers first
            if (tempRouteMarker) {
                map.removeLayer(tempRouteMarker);
                tempRouteMarker = null;
            }
            
            // Create a temporary marker with a different style
            tempRouteMarker = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: 'temp-marker',
                    html: '<div style="border-radius:50%;width:14px;height:14px;border:3px solid ' + 
                          (!routeStart ? 'green' : 'red') + ';background-color:rgba(' + 
                          (!routeStart ? '0,255,0' : '255,0,0') + ',0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            
            // Ask for confirmation with modern dialog
            const pointType = !routeStart ? "starting" : "ending";
            const confirmResult = await Swal.fire({
                title: `Confirm ${pointType} point`,
                text: `Set ${pointType} point at coordinates: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: !routeStart ? '#00d2ff' : '#ff416c',
                cancelButtonColor: '#6c757d',
                confirmButtonText: `Yes, set ${pointType} point`,
                cancelButtonText: 'Cancel',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff'
            });
            
            if (confirmResult.isConfirmed) {
                // User confirmed position
                if (!routeStart) {
                    // Setting start point
                    routeStart = e.latlng;
                    
                    // Remove old route markers if they exist
                    if (routeStartMarker) {
                        map.removeLayer(routeStartMarker);
                    }
                    
                    // Create draggable start marker
                    routeStartMarker = L.marker(routeStart, {
                        icon: markerIcons.start,
                        draggable: true
                    }).addTo(map);
                    
                    routeStartMarker.bindPopup("Start point").openPopup();
                    
                    // Update route when start marker is dragged
                    routeStartMarker.on('dragend', function(event) {
                        routeStart = routeStartMarker.getLatLng();
                        
                        // Update route if both points exist
                        if (routeEnd) {
                            createRoute(routeStart, routeEnd);
                        }
                    });
                    
                    // Remove the temporary marker
                    map.removeLayer(tempRouteMarker);
                    tempRouteMarker = null;
                    
                    showToast("Start point set. Click on the map to set destination point.", "success", 4000);
                } else {
                    // Setting end point
                    routeEnd = e.latlng;
                    
                    // Remove old route markers if they exist
                    if (routeEndMarker) {
                        map.removeLayer(routeEndMarker);
                    }
                    
                    // Create draggable end marker
                    routeEndMarker = L.marker(routeEnd, {
                        icon: markerIcons.end,
                        draggable: true
                    }).addTo(map);
                    
                    routeEndMarker.bindPopup("End point").openPopup();
                    
                    // Update route when end marker is dragged
                    routeEndMarker.on('dragend', function(event) {
                        routeEnd = routeEndMarker.getLatLng();
                        createRoute(routeStart, routeEnd);
                    });
                    
                    // Remove the temporary marker
                    map.removeLayer(tempRouteMarker);
                    tempRouteMarker = null;
                    
                    // Create the route
                    createRoute(routeStart, routeEnd);
                    
                    // Reset routing mode
                    routingMode = false;
                    document.getElementById('route-toggle').classList.remove('active');
                    map.getContainer().style.cursor = '';
                }
            } else {
                // User did not confirm position, remove temp marker
                map.removeLayer(tempRouteMarker);
                tempRouteMarker = null;
            }
        } else {
            // Enhanced normal mode - show modern popup with action buttons
            const clickedLat = e.latlng.lat.toFixed(5);
            const clickedLng = e.latlng.lng.toFixed(5);
            
            // Create a popup with modern action buttons
            const popupContent = `
                <div class="click-popup">
                    <p>Location: ${clickedLat}, ${clickedLng}</p>
                    <div class="popup-actions">
                        <button id="add-marker-here" class="popup-btn">📌 Add Marker Here</button>
                        <button id="start-route-here" class="popup-btn">🚩 Start Route Here</button>
                        <button id="end-route-here" class="popup-btn">🏁 End Route Here</button>
                    </div>
                </div>
            `;
            
            const popup = L.popup()
                .setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(map);
            
            // Add event listeners to the buttons after the popup is added to the DOM
            setTimeout(() => {
                // Add Marker button
                document.getElementById('add-marker-here').addEventListener('click', async function() {
                    map.closePopup();
                    
                    // Show temp marker for confirmation
                    if (tempMarker) {
                        map.removeLayer(tempMarker);
                    }
                    
                    tempMarker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'temp-marker',
                            html: '<div style="border-radius:50%;width:14px;height:14px;border:3px solid red;background-color:rgba(255,0,0,0.3);"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        })
                    }).addTo(map);
                    
                    const confirmResult = await Swal.fire({
                        title: 'Confirm Position',
                        text: `Place marker at coordinates: ${clickedLat}, ${clickedLng}?`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#667eea',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: 'Yes, place marker',
                        cancelButtonText: 'Cancel',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff'
                    });
                    
                    if (confirmResult.isConfirmed) {
                        const markerDetails = await promptForMarkerDetails();
                        
                        if (markerDetails) {
                            map.removeLayer(tempMarker);
                            tempMarker = null;
                            createUserMarker(e.latlng, markerDetails);
                        } else {
                            map.removeLayer(tempMarker);
                            tempMarker = null;
                        }
                    } else {
                        map.removeLayer(tempMarker);
                        tempMarker = null;
                    }
                });
                
                // Start Route button
                document.getElementById('start-route-here').addEventListener('click', function() {
                    map.closePopup();
                    
                    // Clear any existing route
                    clearRoute();
                    
                    // Set the clicked location as route start
                    routeStart = e.latlng;
                    
                    // Create draggable start marker
                    routeStartMarker = L.marker(routeStart, {
                        icon: markerIcons.start,
                        draggable: true
                    }).addTo(map);
                    
                    routeStartMarker.bindPopup("Start point").openPopup();
                    
                    // Update route when start marker is dragged
                    routeStartMarker.on('dragend', function(event) {
                        routeStart = routeStartMarker.getLatLng();
                        
                        // Update route if both points exist
                        if (routeEnd) {
                            createRoute(routeStart, routeEnd);
                        }
                    });
                    
                    // Activate routing mode
                    routingMode = true;
                    document.getElementById('route-toggle').classList.add('active');
                    map.getContainer().style.cursor = 'crosshair';
                    
                    showToast("Start point set. Click on the map to set destination point.", "success", 4000);
                });
                
                // End Route button (only works if a start point exists)
                document.getElementById('end-route-here').addEventListener('click', function() {
                    map.closePopup();
                    
                    if (!routeStart || !routeStartMarker) {
                        showToast("Please set a start point first", "warning", 3000);
                        return;
                    }
                    
                    // Set the clicked location as route end
                    routeEnd = e.latlng;
                    
                    // Create draggable end marker
                    routeEndMarker = L.marker(routeEnd, {
                        icon: markerIcons.end,
                        draggable: true
                    }).addTo(map);
                    
                    routeEndMarker.bindPopup("End point").openPopup();
                    
                    // Update route when end marker is dragged
                    routeEndMarker.on('dragend', function(event) {
                        routeEnd = routeEndMarker.getLatLng();
                        createRoute(routeStart, routeEnd);
                    });
                    
                    // Create the route
                    createRoute(routeStart, routeEnd);
                    
                    // Reset routing mode
                    routingMode = false;
                    document.getElementById('route-toggle').classList.remove('active');
                    map.getContainer().style.cursor = '';
                });
            }, 10);
        }
    });
    
    // Create control buttons with modern emojis
    const locateControl = L.control({ position: 'topleft' });
    
    locateControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', div);
        button.innerHTML = '📍';
        button.title = 'Find my location';
        button.href = '#';
        button.id = 'locate-btn';
        
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            button.innerHTML = '⏳'; // Loading indicator
            map.locate({ setView: true, maxZoom: 16 });
            
            // Reset button after timeout in case of silent fail
            setTimeout(() => {
                button.innerHTML = '📍';
            }, 5000);
        });
        
        return div;
    };
    
    locateControl.addTo(map);

    // Create a marker placement control button
    const markerControl = L.control({ position: 'topleft' });
    
    markerControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', div);
        button.id = 'marker-toggle';
        button.innerHTML = '📌';
        button.title = 'Add markers';
        button.href = '#';
        
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            markerPlacementMode = !markerPlacementMode;
            
            // Visual feedback for active/inactive state
            if (markerPlacementMode) {
                button.classList.add('active');
                map.getContainer().style.cursor = 'crosshair';
                showToast('Marker placement mode activated. Click on the map to add markers.', 'info', 4000);
            } else {
                button.classList.remove('active');
                map.getContainer().style.cursor = '';
                
                // Clean up temporary marker if it exists
                if (tempMarker) {
                    map.removeLayer(tempMarker);
                    tempMarker = null;
                }
                showToast('Marker placement mode deactivated.', 'info');
            }
        });
        
        return div;
    };
    
    markerControl.addTo(map);

    // Create a routing control button
    const routeControl = L.control({ position: 'topleft' });
    
    routeControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', div);
        button.id = 'route-toggle';
        button.innerHTML = '🚗';
        button.title = 'Create route';
        button.href = '#';
        
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            
            // Clear any existing route
            clearRoute();
            
            // Clear any temporary route markers
            if (tempRouteMarker) {
                map.removeLayer(tempRouteMarker);
                tempRouteMarker = null;
            }
            
            // Toggle routing mode
            routingMode = !routingMode;
            
            // Deactivate marker placement mode if active
            if (markerPlacementMode) {
                markerPlacementMode = false;
                document.getElementById('marker-toggle').classList.remove('active');
                
                // Clean up temporary marker if it exists
                if (tempMarker) {
                    map.removeLayer(tempMarker);
                    tempMarker = null;
                }
            }
            
            // Visual feedback for active/inactive state
            if (routingMode) {
                button.classList.add('active');
                map.getContainer().style.cursor = 'crosshair';
                showToast('Route creation mode activated. Click on the map to set start point, then click again to set end point.', 'info', 5000);
            } else {
                button.classList.remove('active');
                map.getContainer().style.cursor = '';
                showToast('Route creation mode deactivated.', 'info');
            }
        });
        
        return div;
    };
    
    routeControl.addTo(map);

    // Create a "route to my location" button
    const routeToMeControl = L.control({ position: 'topleft' });
    
    routeToMeControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', div);
        button.innerHTML = '🏠';
        button.title = 'Route to my location';
        button.href = '#';
        
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            
            if (!userLocation) {
                showToast("Your location is not available. Please use the locate button first.", "warning", 4000);
                return;
            }
            
            routingMode = true;
            routeStart = userLocation;
            
            showToast("Your location set as start point. Now click on the map to set destination.", "info", 5000);
        });
        
        return div;
    };
    
    routeToMeControl.addTo(map);

    // Create a marker management button
    const markerManageControl = L.control({ position: 'topleft' });
    
    markerManageControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', div);
        button.innerHTML = '✏️';
        button.title = 'Manage markers';
        button.href = '#';
        
        L.DomEvent.on(button, 'click', async function(e) {
            L.DomEvent.preventDefault(e);
            
            if (userMarkers.length === 0) {
                showToast("No user markers to manage. Create some markers first.", "warning", 3000);
                return;
            }
            
            const { value: action } = await Swal.fire({
                title: '<i class="fas fa-tools"></i> Marker Management',
                html: `
                    <div style="text-align: left; color: #ffffff;">
                        <p style="margin-bottom: 16px;">Choose an action for your markers:</p>
                        <div style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 8px;">
                                <input type="radio" name="action" value="edit" style="margin-right: 8px;">
                                <i class="fas fa-edit" style="margin-right: 8px; color: #00d2ff;"></i>
                                Edit a marker (click on it after selecting)
                            </label>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 8px;">
                                <input type="radio" name="action" value="remove" style="margin-right: 8px;">
                                <i class="fas fa-trash" style="margin-right: 8px; color: #ff416c;"></i>
                                Remove a marker (click on it after selecting)
                            </label>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="radio" name="action" value="removeAll" style="margin-right: 8px;">
                                <i class="fas fa-trash-alt" style="margin-right: 8px; color: #dc3545;"></i>
                                Remove all markers
                            </label>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-check"></i> Proceed',
                cancelButtonText: '<i class="fas fa-times"></i> Cancel',
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#6c757d',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                width: '500px',
                preConfirm: () => {
                    const selectedAction = document.querySelector('input[name="action"]:checked');
                    if (!selectedAction) {
                        Swal.showValidationMessage('Please select an action');
                        return false;
                    }
                    return selectedAction.value;
                }
            });
            
            if (action === "removeAll") {
                const confirmRemoveAll = await Swal.fire({
                    title: 'Remove All Markers?',
                    text: 'This action cannot be undone. All user markers will be permanently removed.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Yes, remove all!',
                    cancelButtonText: 'Cancel',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff'
                });
                
                if (confirmRemoveAll.isConfirmed) {
                    for (const marker of userMarkers) {
                        map.removeLayer(marker);
                    }
                    userMarkers.length = 0;
                    showToast('All markers removed successfully!', 'success');
                }
            } else if (action === "edit" || action === "remove") {
                const isEditing = action === "edit";
                const mode = isEditing ? "editing" : "removing";
                
                showToast(`Click on a marker to ${mode === 'editing' ? 'edit' : 'remove'} it`, "info", 5000);
                
                // Create a temporary click handler for marker management
                const originalClickHandlers = {};
                
                // Set up temporary click handlers for each marker
                for (const marker of userMarkers) {
                    originalClickHandlers[marker._leaflet_id] = marker._events.click;
                    
                    // Remove existing click handlers
                    marker.off('click');
                    
                    // Add our temporary handler
                    marker.on('click', async function onTempClick(e) {
                        if (isEditing) {
                            await editMarkerDetails(marker);
                        } else {
                            await removeMarker(marker);
                        }
                        
                        // Restore all original handlers after operation
                        for (const m of userMarkers) {
                            if (m._leaflet_id in originalClickHandlers) {
                                m.off('click');
                                if (originalClickHandlers[m._leaflet_id]) {
                                    m.on('click', originalClickHandlers[m._leaflet_id].fn);
                                }
                            }
                        }
                    });
                }
                
                // Cancel option with timeout
                setTimeout(() => {
                    // If user hasn't clicked a marker within 10 seconds, restore handlers
                    for (const marker of userMarkers) {
                        if (marker._leaflet_id in originalClickHandlers) {
                            marker.off('click');
                            if (originalClickHandlers[marker._leaflet_id]) {
                                marker.on('click', originalClickHandlers[marker._leaflet_id].fn);
                            }
                        }
                    }
                    showToast(`${mode.charAt(0).toUpperCase() + mode.slice(1)} mode automatically canceled after 10 seconds`, "info", 3000);
                }, 10000);
            }
        });
        
        return div;
    };
    
    markerManageControl.addTo(map);

    // Create a clear route button
    const clearRouteControl = L.control({ position: 'topleft' });
    
    clearRouteControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', div);
        button.innerHTML = '🗑️';
        button.title = 'Clear route';
        button.href = '#';
        
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            
            if (routingControl || routeStartMarker || routeEndMarker) {
                clearRoute();
                showToast('Route cleared successfully!', 'success');
                
                // Reset routing mode
                routingMode = false;
                const routeToggle = document.getElementById('route-toggle');
                if (routeToggle) {
                    routeToggle.classList.remove('active');
                    map.getContainer().style.cursor = '';
                }
            } else {
                showToast('No route to clear.', 'info');
            }
        });
        
        return div;
    };
    
    clearRouteControl.addTo(map);

    // Enhanced help button functionality
    document.getElementById('help-btn').addEventListener('click', function() {
        Swal.fire({
            title: '<i class="fas fa-info-circle"></i> Interactive Map Pro',
            html: `
                <div style="text-align: left; color: #2d3748; line-height: 1.6;">
                    <h4 style="color: #667eea; margin-bottom: 12px;"><i class="fas fa-mouse-pointer"></i> Map Controls</h4>
                    <ul style="margin-left: 20px;">
                        <li><strong>Click anywhere</strong> - Add markers or start routing</li>
                        <li><strong>Right-click</strong> - Access context menu</li>
                        <li><strong>Scroll</strong> - Zoom in/out</li>
                        <li><strong>Drag</strong> - Pan around the map</li>
                    </ul>
                    
                    <h4 style="color: #667eea; margin: 16px 0 12px 0;"><i class="fas fa-tools"></i> Features</h4>
                    <ul style="margin-left: 20px;">
                        <li><i class="fas fa-map-marker-alt"></i> Custom markers with multiple colors</li>
                        <li><i class="fas fa-route"></i> Route planning between points</li>
                        <li><i class="fas fa-location-arrow"></i> Geolocation services</li>
                        <li><i class="fas fa-search"></i> Interactive search capabilities</li>
                    </ul>
                    
                    <h4 style="color: #667eea; margin: 16px 0 12px 0;"><i class="fas fa-keyboard"></i> Keyboard Shortcuts</h4>
                    <ul style="margin-left: 20px;">
                        <li><strong>Escape</strong> - Cancel current operation</li>
                        <li><strong>Delete</strong> - Remove selected marker</li>
                        <li><strong>Ctrl+Z</strong> - Undo last action</li>
                    </ul>
                </div>
            `,
            icon: null,
            showConfirmButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> Got it!',
            confirmButtonColor: '#667eea',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            customClass: {
                popup: 'modern-popup',
                title: 'modern-title',
                content: 'modern-content'
            },
            width: '600px'
        });
    });

    // Settings button functionality
    document.getElementById('settings-btn').addEventListener('click', function() {
        Swal.fire({
            title: '<i class="fas fa-cog"></i> Map Settings',
            html: `
                <div style="text-align: left; color: #2d3748;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                            <i class="fas fa-layer-group"></i> Map Style
                        </label>
                        <select id="map-style" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
                            <option value="osm">OpenStreetMap (Default)</option>
                            <option value="satellite">Satellite View</option>
                            <option value="terrain">Terrain View</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
                            <i class="fas fa-palette"></i> Theme
                        </label>
                        <select id="app-theme" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd;">
                            <option value="default">Default</option>
                            <option value="ocean">Ocean Blue</option>
                            <option value="sunset">Sunset Orange</option>
                            <option value="forest">Forest Green</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="enable-animations" checked style="margin-right: 8px;">
                            <i class="fas fa-magic" style="margin-right: 8px;"></i>
                            Enable Animations
                        </label>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="auto-locate" checked style="margin-right: 8px;">
                            <i class="fas fa-location-arrow" style="margin-right: 8px;"></i>
                            Auto-locate on startup
                        </label>
                    </div>
                </div>
            `,
            icon: null,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> Save Settings',
            cancelButtonText: '<i class="fas fa-times"></i> Cancel',
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#ffffff',
            customClass: {
                popup: 'modern-popup'
            },
            width: '500px',
            preConfirm: () => {
                // Save settings logic here
                const mapStyle = document.getElementById('map-style').value;
                const appTheme = document.getElementById('app-theme').value;
                const enableAnimations = document.getElementById('enable-animations').checked;
                const autoLocate = document.getElementById('auto-locate').checked;
                
                // Apply settings
                applyMapStyle(mapStyle);
                applyTheme(appTheme);
                
                // Save to localStorage
                localStorage.setItem('mapSettings', JSON.stringify({
                    mapStyle,
                    appTheme,
                    enableAnimations,
                    autoLocate
                }));
                
                showToast('Settings saved successfully!', 'success');
            }
        });
    });

    // Function to apply map styles
    function applyMapStyle(style) {
        // Remove existing tile layers
        map.eachLayer(function (layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        // Add new tile layer based on selection
        let tileLayer;
        switch(style) {
            case 'satellite':
                tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
                });
                break;
            case 'terrain':
                tileLayer = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://stamen.com">Stamen Design</a>'
                });
                break;
            case 'dark':
                tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
                });
                break;
            default:
                tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                });
        }
        tileLayer.addTo(map);
    }

    // Function to apply themes
    function applyTheme(theme) {
        const root = document.documentElement;
        switch(theme) {
            case 'ocean':
                root.style.setProperty('--primary-solid', '#0077be');
                root.style.setProperty('--secondary', '#004c7a');
                break;
            case 'sunset':
                root.style.setProperty('--primary-solid', '#ff6b35');
                root.style.setProperty('--secondary', '#cc5429');
                break;
            case 'forest':
                root.style.setProperty('--primary-solid', '#2d5a27');
                root.style.setProperty('--secondary', '#1e3a1a');
                break;
            default:
                root.style.setProperty('--primary-solid', '#667eea');
                root.style.setProperty('--secondary', '#764ba2');
        }
    }

    // Load saved settings on startup
    function loadSettings() {
        const saved = localStorage.getItem('mapSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            applyMapStyle(settings.mapStyle || 'osm');
            applyTheme(settings.appTheme || 'default');
        }
    }

    // Load settings on page load
    loadSettings();

    // Automatically try to locate the user when the page loads
    map.locate({ setView: true, maxZoom: 16 });
    
    // Show welcome toast
    setTimeout(() => {
        showToast("Welcome to Interactive Map! Click anywhere to begin.", "info", 5000);
    }, 1000);
});
