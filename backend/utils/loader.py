import os
import json
from pymongo import ASCENDING
from flask import current_app

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
STATIONS_FILE = os.path.join(DATA_DIR, 'stations.json')
ROUTES_FILE = os.path.join(DATA_DIR, 'routes.json')

def _load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def initialise_offline_data(db):
    """Load stations and routes JSON into MongoDB if collections are empty.
    Creates indexes for fast lookup.
    """
    # Stations
    if db.stations.estimated_document_count() == 0:
        stations = _load_json(STATIONS_FILE)
        if stations:
            db.stations.insert_many(stations)
            db.stations.create_index([('code', ASCENDING)], unique=True)
            db.stations.create_index([('name', ASCENDING)])
            print('Loaded stations data')
    # Routes
    if db.routes.estimated_document_count() == 0:
        routes = _load_json(ROUTES_FILE)
        if routes:
            db.routes.insert_many(routes)
            db.routes.create_index([('train_number', ASCENDING)], unique=True)
            db.routes.create_index([('stops.station_code', ASCENDING)])
            print('Loaded routes data')
