/*
 * public/js/map.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Renders the interactive Mapbox GL map on a listing's show page: a
 *   marker + popup at the listing's coordinates, a pulsing-dot animated
 *   marker layer, zoom controls, a geocoder search box, and fullscreen
 *   control.
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - `mapToken` and `listing` globals, injected inline by
 *     views/listings/show.ejs (which embeds MAP_TOKEN and the listing's
 *     geometry as a <script> block before loading this file).
 *   - Mapbox GL JS + Mapbox Geocoder libraries (loaded via CDN in
 *     views/layouts/boilerplate.ejs or show.ejs).
 *
 * USED ON: views/listings/show.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

if (
    typeof mapToken === "undefined" ||
    typeof listing === "undefined" ||
    !listing?.geometry?.coordinates
) {
    console.error("Map data is missing.");
} else if (typeof mapboxgl === "undefined") {
    console.error("Mapbox GL JS failed to load.");
} else {

    const coordinates = listing.geometry.coordinates;

    if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !Number.isFinite(Number(coordinates[0])) ||
        !Number.isFinite(Number(coordinates[1]))
    ) {
        console.error("Listing coordinates are invalid.");
    } else {

        const [longitude, latitude] = coordinates.map(Number);

        if (
            longitude < -180 ||
            longitude > 180 ||
            latitude < -90 ||
            latitude > 90
        ) {
            console.error("Listing coordinates are outside valid GeoJSON ranges.");
        } else {

            mapboxgl.accessToken = mapToken;

            const mapContainer =
                document.getElementById("map");

            if (mapContainer) {

                const map = new mapboxgl.Map({
                    container: "map",
                    style: "mapbox://styles/mapbox/streets-v12",
                    center: [
                        longitude,
                        latitude,
                    ],
                    zoom: 1,
                    cooperativeGestures: true, // requires Ctrl/Cmd+scroll to zoom, so page scroll isn't hijacked
                });

                // Marker + popup at the listing's exact location.
                const escapeHTML = (value) => {
                    const div =
                        document.createElement("div");

                    div.textContent = value ?? "";

                    return div.innerHTML;
                };

                new mapboxgl.Marker({ color: "red" })
                    .setLngLat([
                        longitude,
                        latitude,
                    ])
                    .setPopup(
                        new mapboxgl.Popup({
                            offset: 25,
                        }).setHTML(
                            `<h6>${escapeHTML(listing.title)}</h6>
                            <p><b>${escapeHTML(listing.location)}, ${escapeHTML(listing.country)}</b></p>
                            <p>Exact location will be provided after booking!</p>`
                        )
                    )
                    .addTo(map);

                // ---------------- auto zoom animated transition--------------------------------
                // Animate from the initial world-view zoom (1) in to street level (12) on load.
                map.zoomTo(12, {
                    duration: 8000,
                    offset: [0, 0],
                });

                map.setMaxZoom(18.75);

                // map.scrollZoom.disable();

                // Add the geocoder search control to the map.
                if (
                    typeof MapboxGeocoder !==
                    "undefined"
                ) {
                    map.addControl(
                        new MapboxGeocoder({
                            accessToken:
                                mapboxgl.accessToken,
                            mapboxgl: mapboxgl,
                        })
                    );
                }

                map.addControl(
                    new mapboxgl.FullscreenControl()
                );

                // ----------------zoomin - zoomout button----------------------------------------
                // Called from custom on-page zoom buttons (not Mapbox's default control).

                window.zoomin = () => {

                    let zoomP = map.getZoom();

                    if (zoomP < 18) {
                        zoomP++;
                    }

                    map.zoomTo(zoomP);

                };

                window.zoomout = () => {

                    let zoomM = map.getZoom();

                    if (zoomM > 0) {
                        zoomM--;
                    }

                    map.zoomTo(zoomM);

                };

                // ----------------Add an animated icon to the map------------------------------
                // Builds a custom "pulsing dot" image (drawn frame-by-frame on an in-memory
                // canvas) that Mapbox re-renders continuously to create a radar-style pulse
                // animation at the listing's marker location.

                const size = 200;

                const pulsingDot = {

                    width: size,

                    height: size,

                    data: new Uint8Array(
                        size * size * 4
                    ),

                    onAdd: function () {

                        const canvas =
                            document.createElement(
                                "canvas"
                            );

                        canvas.width = this.width;
                        canvas.height = this.height;

                        this.context =
                            canvas.getContext("2d");

                    },

                    // Called on every animation frame by Mapbox to redraw the pulsing ring.
                    render: function () {

                        const duration = 1000;

                        const t =
                            (performance.now() %
                                duration) /
                            duration; // 0 -> 1 progress through the pulse cycle

                        const radius =
                            (size / 2) * 0.3;

                        const outerRadius =
                            (size / 2) *
                                0.7 *
                                t +
                            radius;

                        const context =
                            this.context;

                        if (!context) {
                            return false;
                        }

                        context.clearRect(
                            0,
                            0,
                            this.width,
                            this.height
                        );

                        context.beginPath();

                        context.arc(
                            this.width / 2,
                            this.height / 2,
                            outerRadius,
                            0,
                            Math.PI * 2
                        );

                        context.fillStyle =
                            `rgba(255, 100, 100, ${1 - t})`;

                        context.fill();

                        context.beginPath();

                        context.arc(
                            this.width / 2,
                            this.height / 2,
                            radius,
                            0,
                            Math.PI * 2
                        );

                        context.fillStyle =
                            "rgba(255, 75, 75, 1)";

                        context.strokeStyle =
                            "white";

                        context.lineWidth =
                            2 + 4 * (1 - t);

                        context.fill();

                        context.stroke();

                        this.data =
                            context
                                .getImageData(
                                    0,
                                    0,
                                    this.width,
                                    this.height
                                )
                                .data;

                        map.triggerRepaint(); // ask Mapbox to call render() again next frame

                        return true;

                    },

                };

                map.on("load", () => {

                    map.addImage(
                        "pulsing-dot",
                        pulsingDot,
                        {
                            pixelRatio: 2,
                        }
                    );

                    map.addSource(
                        "dot-point",
                        {
                            type: "geojson",

                            data: {
                                type: "FeatureCollection",

                                features: [
                                    {
                                        type: "Feature",

                                        geometry: {
                                            type: "Point",
                                            coordinates: [
                                                longitude,
                                                latitude,
                                            ],
                                        },
                                    },
                                ],
                            },

                        }
                    );

                    map.addLayer({
                        id: "layer-with-pulsing-dot",
                        type: "symbol",
                        source: "dot-point",

                        layout: {
                            "icon-image":
                                "pulsing-dot",
                        },

                    });

                });

            }

        }

    }

}