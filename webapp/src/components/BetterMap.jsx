import React from "react";
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import './BetterMap.css'

function getClubHref(club) {
    if(club.website.indexOf("freefit") > -1) {
        return `https://freefit.co.il/CLUBS/?CLUB=${club.id}&SUBCLUBCATEGORY=-1`
    }
    return club.website.replace("http", "https")
}

function getFreefitUrl(id) {
    return `https://freefit.co.il/CLUBS/?CLUB=${id}&SUBCLUBCATEGORY=-1`
}

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
                            <h3>
                                <div><a href={getClubHref(club)} target="_blank" rel="noreferrer">{club.title}</a> </div>
                                <div><a href={getFreefitUrl(club.id)} target="_blank" rel="noreferrer"> (freefit) </a></div>
                            </h3>
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