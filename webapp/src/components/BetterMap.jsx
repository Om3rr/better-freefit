import React from "react";
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import './BetterMap.css'


function BetterMap({clubs, selectedTags}) {
    console.log(clubs)
    return (
        clubs && <MapContainer center={[32.09, 34.77]} zoom={15} scrollWheelZoom={true}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {clubs.filter(club => Array.isArray(club.lat_lng)).map((club) => (
                <Marker key={club.id} position={club.lat_lng} title={club.title}>
                    <Popup>
                        <div className="popup-container">
                            <h3>{club.title}</h3>
                            {club.about}
                            <div className="tags">{club.tags.map((t, idx) => <span
                                className={`tag ${selectedTags.indexOf(t) > -1 ? "selected" : ""}`}
                                key={idx}>{t}</span>)}</div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export default BetterMap;