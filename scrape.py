import json
import os
import time
from argparse import ArgumentParser
import requests
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field
from typing import List, Tuple, Optional
from logging import getLogger
import logging
import sys

root = getLogger(__name__)
root.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
root.addHandler(handler)

logger = getLogger(__name__)
def format_bsf_object(elem):
    s = []
    for c in elem.contents:
        cc = c
        if not isinstance(cc, str):
            cc = cc.get_text()
        if not cc:
            continue
        s.append(cc)
    return s[0], "\n".join(s[1:])


class FreeFitPartialClub(BaseModel):
    Id: int
    Name: str


def get_all_clubs(area) -> List[FreeFitPartialClub]:
    clubz = requests.post(
        "https://freefit.co.il/Master.asmx/SearchClubList",
        json={"CompanyID": 0, "subcategoryId": "-1", "area": area, "freeText": ""}).json().get("d")
    return [FreeFitPartialClub(**x) for x in clubz]


class Club(BaseModel):
    id: int
    title: str
    lat_lng: Optional[Tuple[float, float]]
    address: str
    phone: str
    website: str
    tags: List[str]
    logo: str
    about: str
    latest_ts: int = Field(default_factory=lambda: int(time.time()))


def find_address_in_google(address):
    logger.info(f"Trying to search for the address: {address} in google.")
    response = requests.get("https://maps.googleapis.com/maps/api/place/findplacefromtext/json", params=dict(
        input=address,
        inputtype="textquery",
        key=os.getenv("GOOGLE_API_KEY"),
        fields=["geometry"]
    ))
    json_res = response.json()
    if "candidates" not in json_res:
        return
    logger.info("Success")
    location = json_res["candidates"][0]["geometry"]["location"]
    return location.get("lat"), location.get("lng")


def parse_club(club_id):
    bsf = BeautifulSoup(requests.get(f"https://freefit.co.il/CLUBS/?CLUB={club_id}&SUBCLUBCATEGORY=-1").text)
    club_details = bsf.find_all("div", {"class": "detail"})
    title = bsf.find(id="headerText").find("h1").get_text()
    logo = bsf.find(id="logo").find("img")['src']
    about = bsf.find(id="textAbout").get_text()
    _, address = format_bsf_object(club_details[2])
    _, phone = format_bsf_object(club_details[3])
    _, website = format_bsf_object(club_details[6])
    try:
        # the lat_lng extraction is to nasty but it find 90% of the cases
        lat_lng = club_details[8].find("a")['href'].split("/")[6]
        lat, lng, *_ = lat_lng.replace("@", "").split(",")
        lat_lng = (float(lat), float(lng))
    except Exception:
        try:
            lat_lng = find_address_in_google(address)
        except Exception as e:
            lat_lng = None
    tags = [format_bsf_object(x)[1] for x in club_details[11:]]
    return Club(id=club_id, title=title, tags=tags, address=address, phone=phone,
                lat_lng=lat_lng, website=website, logo=logo, about=about)


def write_clubs(clubs, clubs_file):
    with open(clubs_file, "w+") as f:
        json.dump(clubs, f, indent=4)


def scrape(clubs_file, area):
    try:
        with open(clubs_file, "r") as fr:
            clubs = json.load(fr)
    except Exception:
        clubs = {}
    all_clubs = get_all_clubs(area)
    logger.info(f"Found {len(all_clubs)} in {area}! going deeper")
    # In the beginning I thought to make it parallel with spaceships but its an overkill :/
    for club in all_clubs:
        if str(club.Id) in clubs:
            logger.info(f"Skipping {club.Id}, already exists")
            continue
        logger.info(f"Parsing club {club.Id}")
        try:
            parsed_club = parse_club(club.Id)
        except Exception as e:
            logger.info(f"Failed parsing club {club.Id} :/ {str(e)}")
            continue
        clubs[club.Id] = parsed_club.dict()
        write_clubs(clubs, clubs_file)
    current_clubs = set([str(club.Id) for club in all_clubs])
    existing_clubs = set(clubs.keys())
    removed_clubs = existing_clubs - current_clubs
    logger.info(f"Removing {len(removed_clubs)} clubs from overall {len(all_clubs)}")
    for club_id in removed_clubs:
        del clubs[club_id]
    write_clubs(clubs, clubs_file)



if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--clubs_file", default="./webapp/src/data/clubs.json")
    parser.add_argument("--area", default="תל אביב", help="Area to search clubs in, by default its tel-aviv")
    args = parser.parse_args()

    scrape(args.clubs_file, args.area)
