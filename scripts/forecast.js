(function() {
  'use strict';

  //var weatherAPIUrlBase = 'https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/16066c67a72d19056c7e99e75179cbf0/37.8267,-122.4233';
  var weatherAPIUrlBase = 'https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/16066c67a72d19056c7e99e75179cbf0/';
  var googleAPIUrlBase = 'https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyD3McvcO3ope-RjNo7BnBc-djx4FlMZYHM/';
  //var key = '16066c67a72d19056c7e99e75179cbf0';
  //var weatherAPIUrlBase = 'https://publicdata-weather.firebaseio.com/';

  /* Event listener for add new city button */
  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  /* Event listener for add new city to the storage */
  document.getElementById('butAddCity').addEventListener('click', function() {
    var infowindowContent = document.getElementById('infowindow-content');
    var latLong = infowindowContent.children['place-location'].textContent;
    var array = latLong.split(',');
    var lat = array[0].substr(1);
    var long = array[1].substr(0,array[1].length-1);
    console.log('Saving location - Lat: '+lat);
    console.log('Saving location - Long: '+long);
    app.getForecast(lat,long);
    // close the new city dialog
    app.toggleAddDialog(false);

  });

  /* Event listener for add new city button */
  document.getElementById('butAddCancel').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(false);
  });


  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };


  app.updateForecastCard = function(data) {
    console.log("Initializing method app.updateForecastCard...");

    var card = app.visibleCards[data.timezone];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.timezone;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.timezone] = card;
    }
    card.querySelector('.description').textContent = data.currently.summary;
    card.querySelector('.date').textContent =
      new Date(data.currently.time * 1000);
    card.querySelector('.current .icon').classList.add(data.currently.icon);
    card.querySelector('.current .temperature .value').textContent =
      Math.round(data.currently.temperature);
    card.querySelector('.current .feels-like .value').textContent =
      Math.round(data.currently.apparentTemperature);
    card.querySelector('.current .precip').textContent =
      Math.round(data.currently.precipProbability * 100) + '%';
    card.querySelector('.current .humidity').textContent =
      Math.round(data.currently.humidity * 100) + '%';
    card.querySelector('.current .wind .value').textContent =
      Math.round(data.currently.windSpeed);
    card.querySelector('.current .wind .direction').textContent =
      data.currently.windBearing;
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.daily.data[i];
      if (daily && nextDay) {
        nextDay.querySelector('.date').textContent =
          app.daysOfWeek[(i + today) % 7];
        nextDay.querySelector('.icon').classList.add(daily.icon);
        nextDay.querySelector('.temp-high .value').textContent =
          Math.round(daily.temperatureMax);
        nextDay.querySelector('.temp-low .value').textContent =
          Math.round(daily.temperatureMin);
      }
    }
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };

  app.getForecastInfo = function(url) {
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      var response = JSON.parse(request.response);
      app.updateForecastCard(response);
    };
    request.open('GET', url, true);
    request.send();
  };

  app.getForecast = function(lat,long) {
    var url = weatherAPIUrlBase+lat+','+long;
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
          var response = JSON.parse(request.response);
          saveLocation(response,url);
          //localforage.clear();
          };
    request.open('GET', url);
    request.send();

  };

  function saveLocation(response,url){
    var place = response.timezone;
    //Verify is the key locations exist
    var exist = false;
    localforage.getItem('locations').then(function(value) {
    // This code runs once the value has been loaded
    // from the offline store.
    console.log('Getting locations...');

    if(value!==null){
      console.log('Locations: '+value);
      //Verify is the url already exist
      var j=0;
    for(var i in value){
    //Verify is the object has the property
      if(value.hasOwnProperty(i)){
        if(i===place){
          exist = true;
        }
      }
    }

      if(exist){
        console.log('The url is already included');
      }
      else{
        //Using localforage to storage data
        var locations = value;
        locations[place]=url;
        localforage.setItem('locations', locations).then(function(value) {
          console.log('Inserting locations...');
          console.log('Locations: '+value);
          app.updateForecastCard(response);  
        }).catch(function(err) {
          console.log(err);
        });
      }
    }
    else{
      var locations = {};
      locations[place]=url;
      localforage.setItem('locations', locations).then(function(value) {
          console.log('Inserting locations...');
          console.log('Locations: '+value);
          app.updateForecastCard(response);  
        }).catch(function(err) {
          console.log(err);
        });
    }  
    //End of getItem function
    }).catch(function(err) {
      // This code runs if there were any errors
      console.log(err);
    });
  }

  function setItem(key,value){
    localforage.setItem(key, value).then(function(value) {
      console.log('Inserting '+key+'...');
      console.log(key+' value: '+value);  
    }).catch(function(err) {
      console.log(err);
    });
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function() {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(key) {
      app.getForecast(key);
    });
  };

/*****************************************************************************
   *
   * Methods to get the current location
   *
   ****************************************************************************/
   function geoLocation(){
      if (navigator.geolocation)
      {
        navigator.geolocation.getCurrentPosition(successFunction, errorFunction);
      }
      else 
      {
        console.log('It seems like Geolocation, which is required for this page, is not enabled in your browser.');
      } 
    }

    function successFunction(position) 
    {
      var lat = position.coords.latitude;
      var long = position.coords.longitude;
      console.log(lat);
      console.log(long);
      app.getForecast(lat,long);
      //alert('Your latitude is :'+lat+' and longitude is '+long);
    }

    function errorFunction(position) 
    {
      console.log('Error!');
    }  
    //Maing method
    document.addEventListener('DOMContentLoaded',function(){
      localforage.getItem('locations').then(function(locations) {
          console.log('Initializing app - Looking for locations: '+locations);
          if(locations!==null){
            console.log('Loading locations...');
            for(var i in locations){
              console.log(locations[i]);
              app.getForecastInfo(locations[i]);
            }
          }
          else{
            geoLocation();
          }
      }).catch(function(err) {
        console.log(err);
      });
    });

})();