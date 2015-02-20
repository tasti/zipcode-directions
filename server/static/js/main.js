'use strict';

var map, geocoder;
var colors = ['blue', 'orange', 'yellow', 'purple', 'pink'];
var mapObjects = [];

var initialize = function () {
  var mapOptions = {
    center: { lat: 37.783, lng: -122.417 }, // San Francisco
    zoom: 10
  };

  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  geocoder = new google.maps.Geocoder();
};

google.maps.Map.prototype.clear = function () {
  // Remove the data overlays
  map.data.forEach(function (feature) {
    map.data.remove(feature);
  });

  // Remove all map objects (i.e. markers and polyline)
  mapObjects.forEach(function (mapObject) {
    mapObject.setMap(null);
  });

  mapObjects = [];
};

// color must be one of: ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink']
var createMarker = function (lat, lng, color) {
  return new google.maps.Marker({
    position: { lat: lat, lng: lng },
    map: map,
    icon: 'http://maps.google.com/mapfiles/ms/icons/' + color + '-dot.png'
  });
};

var createInfoWindow = function (content) {
  return new google.maps.InfoWindow({
    content: content
  });
};

var getLatLng = function (address, caller) {
  var deferred = $.Deferred();

  geocoder.geocode({ 'address': address }, function (results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      deferred.resolve({ 
        lat: results[0]['geometry']['location']['k'],
        lng: results[0]['geometry']['location']['D']
      });
    } else {
      deferred.reject({ status: status, caller: caller });
    }
  });

  return deferred.promise();
};

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

/*
  Used to detect a successful request from map.data.loadGeoJson, since the map api
  doesn't provide a callback parameter.

  setFeatureStyle() is only called after the request is made successfully, so our
  callback is called one time when the first feature data is being added
*/
var isFirstCallback = function () {
  return mapObjects.length === 3;
};

var loadGeoJsonCallback = function () {
  enableElement('#submit');
  $('#submit').val('Get directions');
};

var setFeatureStyle = function (feature) {
  if (isFirstCallback()) {
    loadGeoJsonCallback();
  }

  var zipcode = feature.getProperty('ZCTA5CE10');
  var color = colors[zipcode % colors.length];
  feature.setProperty('COLOR', color);

  var marker = createMarker(feature.getProperty('LAT_CENTER'), feature.getProperty('LNG_CENTER'), color);
  var infowindow = createInfoWindow(zipcode);
  mapObjects.push(marker);

  // Add the marker + infowindow as properties for use in event handlers
  feature.setProperty('MARKER', marker);
  feature.setProperty('INFO_WINDOW', infowindow);

  return {
    fillColor: color,
    strokeColor: color,
    strokeWeight: 2
  };
};

var updateFeatureStyle = function (feature) {
  var color = feature.getProperty('COLOR');

  return {
    fillColor: color,
    strokeColor: color,
    strokeWeight: 2
  };
};

var displayXMarkerAndInfoWindow = function (address, location, color) {
  var marker = createMarker(location.lat, location.lng, color);
  var infowindow = createInfoWindow(address);

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map, marker);
  });
  infowindow.open(map, marker); // Open by default

  mapObjects.push(marker);
}

var displayStartMarkerAndInfoWindow = function (address, location) {
  displayXMarkerAndInfoWindow(address, location, 'red');
};

var displayDestinationMarkerAndInfoWindow = function (address, location) {
  displayXMarkerAndInfoWindow(address, location, 'green');
};

var fitDirectionsInViewport = function () {
  var start = mapObjects[0],
      destination = mapObjects[1];

  // The leftmost value must be first in the bounds list
  if (start.getPosition().lng() > destination.getPosition().lng()) {
    var temp = start;
    start = destination;
    destination = temp;
  }

  var bounds = new google.maps.LatLngBounds(
    start.getPosition(),
    destination.getPosition()
  );

  map.fitBounds(bounds);
};

var displayPathFromStartToDestination = function (locationA, locationB) {
  var directionsCoordinates = [
    new google.maps.LatLng(locationA.lat, locationA.lng),
    new google.maps.LatLng(locationB.lat, locationB.lng)
  ];
  var directionsPath = new google.maps.Polyline({
    path: directionsCoordinates,
    geodesic: false, // Fiona/Shapely does not take into account the earth's curvature
    strokeColor: '#000000',
    strokeOpacity: 1.0,
    strokeWeight: 4
  });

  directionsPath.setMap(map);

  mapObjects.push(directionsPath);
};

var displayZipcodeAreas = function (locationA, locationB) {
  // Loads the shape data onto the map
  var url = '/api/v1/geojson?latA=' + locationA['lat'] + '&lngA=' + locationA['lng'] + '&latB=' + locationB['lat'] + '&lngB=' + locationB['lng'];
  map.data.loadGeoJson(url); // Doesn't provide a callback option (see isFirstCallback() for fix)

  map.data.setStyle(setFeatureStyle);

  // Highlight the area and make the infowindow visible
  map.data.addListener('mouseover', function (event) {
    map.data.setStyle(updateFeatureStyle); // Prevents a new data object being created on each event
    map.data.overrideStyle(event.feature, { strokeWeight: 8 });

    var marker = event.feature.getProperty('MARKER');
    var infowindow = event.feature.getProperty('INFO_WINDOW');

    infowindow.open(map, marker);
  });

  // Revert to default style and hide infowindow
  map.data.addListener('mouseout', function (event) {
    map.data.overrideStyle(event.feature, { strokeWeight: 2 });

    var infowindow = event.feature.getProperty('INFO_WINDOW');

    infowindow.close();
  });
};

var disableElement = function (selector) {
  $(selector).prop('disabled', true);
  $(selector).addClass('disabled');
};

var enableElement = function (selector) {
  $(selector).removeAttr('disabled');
  $(selector).removeClass('disabled');
};

var onClickSubmit = function () {
  map.clear();

  var addressA = $('#pointA').val().trim();
  var addressB = $('#pointB').val().trim();

  if (addressA === '') {
    $('#message').text('Start cannot be left blank.');
    $('#pointA').select();

    return;
  } else if (addressB === '') {
    $('#message').text('Destination cannot be left blank.');
    $('#pointB').select();

    return;
  }

  disableElement('#submit');
  $('#submit').val('Loading...');

  // Used to determine which promise failed
  var CALLER_A = 0, CALLER_B = 1;

  $.when(getLatLng(addressA, CALLER_A), getLatLng(addressB, CALLER_B)).done(function (locationA, locationB) {
    displayStartMarkerAndInfoWindow(addressA, locationA);

    displayDestinationMarkerAndInfoWindow(addressB, locationB);

    fitDirectionsInViewport();

    displayPathFromStartToDestination(locationA, locationB);

    displayZipcodeAreas(locationA, locationB);

    $('#message').text('The directions from "' + addressA + '" to "' + addressB + '" are displayed below.');
  }).fail(function (error) {
    if (error.status === google.maps.GeocoderStatus.ZERO_RESULTS) {
      if (error.caller === CALLER_A) {
        $('#message').text('The address "' + addressA + '" could not be found.');
        $('#pointA').select();
      } else if (error.caller === CALLER_B) {
        $('#message').text('The address "' + addressB + '" could not be found.');
        $('#pointB').select();
      } else {
        $('#message').text('An unexpected error occurred: ' + error.status);  
      }
    } else {
      $('#message').text('An unexpected error occurred: ' + error.status);
    }

    enableElement('#submit');
    $('#submit').val('Get directions');
  });
};

var main = function () {
  google.maps.event.addDomListener(window, 'load', initialize);

  // Trigger submit when enter is clicked in the input
  $('.point').keyup(function (event) {
    if ((event.keyCode === 13) && !$("#submit").hasClass('disabled')) {
      $('#submit').click();
    }
  });

  $('#submit').click(onClickSubmit);
};

$(main);
