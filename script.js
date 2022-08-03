function initMap() {
  let map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40, lng: -93 },
    zoom: 4,
    mapTypeId: "roadmap",
    disableDefaultUI: true,
    styles: dark,
  });

  function Radar() {
    const timestamps = [
      "900913",
      "900913-m05m",
      "900913-m10m",
      "900913-m15m",
      "900913-m20m",
      "900913-m25m",
      "900913-m30m",
      "900913-m35m",
      "900913-m40m",
      "900913-m45m",
      "900913-m50m",
    ];

    let tileNEX = [];

    timestamps.forEach((timestamp, index) => {
      tileNEX[index] = new google.maps.ImageMapType({
        getTileUrl: (tile, zoom) => {
          return (
            `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-${timestamp}/${zoom}/${tile.x}/${tile.y}.png` +
            new Date().getTime()
          );
        },
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.0,
        name: `NEXRAD${index}`,
        isPng: true,
      });

      map.overlayMapTypes.push(tileNEX[index]);
    });

    animateRadar();
  }

  function animateRadar() {
    let index = map.overlayMapTypes.getLength() - 1;

    animate = setInterval(() => {
      map.overlayMapTypes.getAt(index).setOpacity(0.0);

      index--;
      if (index < 0) {
        index = map.overlayMapTypes.getLength() - 1;
      }
      map.overlayMapTypes.getAt(index).setOpacity(0.6);
    }, 200);
  }

  Radar();

  const key = API_KEY;
  let layer;
  let myMapType = new google.maps.ImageMapType({
    getTileUrl: (coord, zoom) => {
      let normalizedCoord = getNormalizedCoord(coord, zoom);
      if (!normalizedCoord) {
        return null;
      }
      let bound = Math.pow(2, zoom);
      return `https://tile.openweathermap.org/map/${layer}/${zoom}/${normalizedCoord.x}/${normalizedCoord.y}.png?appid=${key}`;
    },
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 8,
    minZoom: 0,
    name: "mymaptype",
  });

  // Normalizes the coords that tiles repeat across the x axis (horizontally)
  // like the standard Google map tiles.
  function getNormalizedCoord(coord, zoom) {
    let y = coord.y;
    let x = coord.x;

    // tile range in one direction range is dependent on zoom level
    // 0 = 1 tile, 1 = 2 tiles, 2 = 4 tiles, 3 = 8 tiles, etc
    let tileRange = 1 << zoom;

    // don't repeat across y-axis (vertically)
    if (y < 0 || y >= tileRange) {
      return null;
    }

    // repeat across x-axis
    if (x < 0 || x >= tileRange) {
      x = ((x % tileRange) + tileRange) % tileRange;
    }

    return {
      x: x,
      y: y,
    };
  }

  let endpoint;

  async function fetchForecast() {
    let forecastEl = document.getElementsByClassName("forecast");
    let todayEl = document.getElementsByClassName("day");

    try {
      const res = await fetch(endpoint);
      const data = await res.json();

      if (200 !== res.status) {
        throw "There was a problem. Status Code: " + res.status;
      }

      //clear out forecast element
      todayEl[0].innerHTML = "";
      forecastEl[0].innerHTML = "";

      forecastEl[0].classList.add("loaded");
      let today = data.daily[0];
      let todayTemp = data.daily[0].temp.day.toFixed(0);
      let disc = data.daily[0].weather[0].description;

      day = `<div class="Today">
          <p>Today ${todayTemp}<sup>°F</sup></p>
          </div>
          <div class="discription">
          <p>with ${disc}</p>
          </div>`;
      todayEl[0].insertAdjacentHTML("afterbegin", day);

      data.daily.forEach((value, index) => {
        if (index > 0) {
          let dayname = new Date(value.dt * 1000).toLocaleDateString("en", {
            weekday: "short",
          });
          let icon = value.weather[0].icon;
          let temp = value.temp.day.toFixed(0);
          fday = `<div class="forecast-day">
            <p>${dayname}</p>
            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${icon}.svg" alt="weather icon" class="w-icon">
            <div class="forecast-day--temp">${temp}<sup>°F</sup></div>
            </div>`;
          forecastEl[0].insertAdjacentHTML("beforeend", fday);
        }
      });
    } catch (err) {
      console.log("ERROR: " + err);
    }
  }

  //SearchBox
  const input = document.getElementById("searchInput");
  const searchBox = new google.maps.places.SearchBox(input);

  map.addListener("bounds_changed", () => {
    searchBox.setBounds(map.getBounds());
  });

  let markers = [];

  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }
    // Clear out the old markers.
    markers.forEach((marker) => {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    const bounds = new google.maps.LatLngBounds();
    let lat;
    let lng;

    places.forEach((place) => {
      if (!place.geometry || !place.geometry.location) {
        console.log("Returned place contains no geometry");
        return;
      }
      // Create a marker for each place.
      markers.push(
        new google.maps.Marker({
          map,
          //  icon,
          title: place.name,
          position: place.geometry.location,
        })
      );
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }

      lat = place.geometry.location.lat();
      lng = place.geometry.location.lng();
    });
    map.fitBounds(bounds);
    map.setZoom(6);
    //close keyboard on mobile
    document.activeElement.blur();
    endpoint = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=current,hourly,minutely,alerts&units=imperial&appid=${key}`;
    fetchForecast();
    modal.style.display = "flex";
  });

  //lightbutton
  const light = document.getElementById("light-btn");
  let lightactive = false;
  light.addEventListener("click", () => {
    if (!lightactive) {
      map.setOptions({ styles: "" });
      map.setMapTypeId("roadmap");
      lightactive = true;
    } else {
      lightactive = false;
      map.setOptions({ styles: dark });
      map.setMapTypeId("roadmap");
    }
  });

  //satbutton
  const sat = document.getElementById("sat-btn");
  let satactive = false;
  sat.addEventListener("click", () => {
    if (!satactive) {
      map.setMapTypeId("satellite");
      satactive = true;
    } else {
      satactive = false;
      map.setMapTypeId("roadmap");
    }
  });

  //Toggle button
  let toggleBtn = document.getElementById("toggle-btn");
  let menuItems = document.querySelectorAll(".menu a");
  let menuActive = false;
  toggleBtn.addEventListener("click", () => {
    if (!menuActive) {
      menuItems[0].style.transform = "translate(0px,50px)";
      menuItems[1].style.transform = "translate(0px,100px)";
      menuItems[2].style.transform = "translate(0px,150px)";
      menuItems[3].style.transform = "translate(0px,200px)";
      menuItems[4].style.transform = "translate(0px,250px)";
      menuItems[5].style.transform = "translate(0px,300px)";
      menuActive = true;
      toggleBtn.classList.add("active");

      menuItems.forEach((menuItem) => {
        menuItem.classList.add("shadow");
      });
    } else {
      menuItems.forEach((menuItem) => {
        menuItem.style.transform = "translate(0,0)";
      });
      menuActive = false;
      toggleBtn.classList.remove("active");

      menuItems.forEach((menuItem) => {
        menuItem.classList.remove("shadow");
      });
    }
  });

  //Layer buttons
  const Clouds = document.getElementById("cloud");
  const Precipitation = document.getElementById("rain");
  const Wind = document.getElementById("wind");
  const Temperature = document.getElementById("temp");
  const Pressure = document.getElementById("pressure");
  const radar = document.getElementById("radar");

  Wind.addEventListener("click", () => {
    clearInterval(animate); //stop radar interval animation
    layer = "wind_new";
    map.overlayMapTypes.clear();
    map.overlayMapTypes.insertAt(0, myMapType);
  });
  Clouds.addEventListener("click", () => {
    clearInterval(animate);
    layer = "clouds_new";
    map.overlayMapTypes.clear();
    map.overlayMapTypes.insertAt(0, myMapType);
  });
  Temperature.addEventListener("click", () => {
    clearInterval(animate);
    layer = "temp_new";
    map.overlayMapTypes.clear();
    map.overlayMapTypes.insertAt(0, myMapType);
  });
  Precipitation.addEventListener("click", () => {
    clearInterval(animate);
    layer = "precipitation_new";
    map.overlayMapTypes.clear();
    map.overlayMapTypes.insertAt(0, myMapType);
  });
  Pressure.addEventListener("click", () => {
    clearInterval(animate);
    layer = "pressure_new";
    map.overlayMapTypes.clear();
    map.overlayMapTypes.insertAt(0, myMapType);
  });
  radar.addEventListener("click", () => {
    clearInterval(animate);
    map.overlayMapTypes.clear();
    Radar();
  });

  //Location button
  const locationButton = document.getElementById("location-btn");
  const modal = document.getElementById("modal");

  locationButton.addEventListener("click", () => {
    const bounce = document.getElementById("location-btn");
    bounce.classList.add("bounce");

    // Try HTML5 geolocation.
    navigator.geolocation.getCurrentPosition(onSuccess);

    function onSuccess(position) {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      markers.forEach((marker) => {
        marker.setMap(null);
      });
      bounce.classList.remove("bounce");
      map.setCenter(pos);
      map.setZoom(6);
      document.getElementById("searchInput").value = "";
      markers.push(
        new google.maps.Marker({
          position: pos,
          map,
        })
      );

      let lat = position.coords.latitude;
      let lng = position.coords.longitude;
      endpoint = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&exclude=current,hourly,minutely,alerts&units=imperial&appid=${key}`;
      fetchForecast();
      modal.style.display = "flex";
    }
  });

  //modal close action
  const close = document.getElementById("x");
  close.addEventListener("click", () => {
    modal.style.display = "none";
  });
}
