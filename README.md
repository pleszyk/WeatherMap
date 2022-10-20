# WeatherMap

Shows live weather layers across the globe. (animated radar layer is limited to the U.S.)

## Goals

Implement weather layers onto a map, use clean UI to change layers, find location and show forecast.

## Usage

The top right button displays the layers and switches between them. The bottom right button gets your current location and displays a forecast. The bottom left button toggles satellite map mode. The top left button toggles light & dark mode. The search box will autocomplete suggested places, show a pin & forecast for that location.

## Implementation

Written in plain Javascript, HTML & CSS. Google Maps API for map, autocomplete searchbox & geolocation.
OpenWeatherMaps API for static weather layers and forecast data. 
Iowa Environmental Mesonet Tile Map Service API for animated NEXRAD Base Reflectivity layer


## Sources

<https://developers.google.com/maps/documentation/javascript>

<https://openweathermap.org/api>

<https://mesonet.agron.iastate.edu/ogc/>
