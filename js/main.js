/**
 * Created by clarype on 10/19/2017.
 */
var map = L.map('map').setView([40, -100], 4);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

L.control.scale().addTo(map);

var colors = chroma.scale(['blue','red']).mode('lch').colors(9);

for (i = 0; i < 3; i++) {
    $('head').append($("<style> .marker-color-" + (i + 1).toString() + " { color: " + colors[i] + ";" +
        " font-size: 15px; text-shadow: 0 0 3px #ffffff;} </style>"));
}


// Get GeoJSON and put on it on the map when it loads


L.geoJson.ajax("assets/cellTowers.geojson", {
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.AIRPT_NAME);
    },
    pointToLayer: function (feature, latlng) {
        var id = 0;
        if (feature.properties.CNTL_TWR == "Y") { id = 0; }
        else if (feature.properties.CNTL_TWR == "N")  { id = 1; }
        else { id = 3;} // "Unknown"
        return L.marker(latlng, {icon: L.divIcon({className: 'fa fa-plane marker-color-' + (id + 1).toString() })});
    }
}).addTo(map);









// Set function for color ramp
colors = chroma.scale('blues').mode('hsl').colors(6);
function setColor(density) {
    var id = 0;
    if (density > 40) { id = 5; }
    else if (density > 30 && density <= 40) { id = 4; }
    else if (density > 20 && density <= 30) { id = 3; }
    else if (density > 10 && density <= 20) { id = 2; }
    else if (density > 1  &&  density <= 10) { id = 1; }
    else  { id = 0; }
    return colors[id];
}



// Set style function that sets fill color property equal to cell tower density
function style(feature) {
    return {
        fillColor: setColor(feature.properties.count),
        fillOpacity: 0.4,
        weight: 2,
        opacity: 1,
        color: '#E31A1C',
        dashArray: '4'
    };
}


// Add Neighborhood Polygons
L.geoJson.ajax("assets/us-states.geojson", {
    style: style
}).addTo(map);


var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};


 info.update = function () {
 this._div.innerHTML = '<h4>Airports</h4>' + '<h5><i class="fa fa-plane"  style="color:blue" aria-hidden="true" ></i>' +
 ' Tower</h5>' + '<h5><i class="fa fa-plane" style="color:purple" aria-hidden="true"> No Tower</i> </h5>';
 };

 info.addTo(map);



// get color depending on population density value
function getColor(d) {
    return d > 50 ? '#004d99' :
        d > 40 ? '#0066cc' :
            d > 30 ? '#0080ff' :
                d > 20 ? '#3399ff' :
                    d > 10 ? '#b3daff' :
                        '#cce6ff';
}



var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 30, 40, 50],
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+') ;


    }

    return div;
};

legend.addTo(map);




var cost_underground = 0.001,
    cost_above_ground =5.30,
    html = [
        '<table>',
        ' <tr><td class="cost_label">Flight Fuel Cost:</td><td class="cost_value">${total_above_ground}</td></tr>',

        '</table>'
    ].join(''),
    numberWithCommas = function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

var Core = L.Control.LinearCore.extend({
    onSelect: function(e){

        if(!e.total){
            return;
        }

        var distance = e.total.scalar;

        if(e.total.unit === 'mi'){
            distance *= e.sub_unit;

        } else if(e.total.unit === 'km'){
            distance*= 3280.84;

        } else if(e.total.unit === 'm'){
            distance *= 3.28084;
        }

        var data = {
            total_above_ground: numberWithCommas(L.Util.formatNum(cost_above_ground * distance),2),
            total_underground: numberWithCommas(L.Util.formatNum(cost_underground * distance), 2)
        };

        if(e.rulerOn){
            var content = L.Util.template(html, data),
                popup = L.popup().setContent(content);

            e.total_label.bindPopup(popup, { offset: [45, 0] });
            e.total_label.openPopup();
        }
    }
});

map.addControl(new Core({
    unitSystem: 'imperial',
    color: '#FF0080',
    features: ['ruler']
}));
