import re
from pymongo import ASCENDING
from flask import request, jsonify

# Helper for case‑insensitive prefix match
def autocomplete_station(db, prefix, limit=10):
    regex = f'^{re.escape(prefix)}'
    cursor = db.stations.find({
        '$or': [
            {'code': {'$regex': regex, '$options': 'i'}},
            {'name': {'$regex': regex, '$options': 'i'}}
        ]
    }).limit(limit)
    return list(cursor)

def find_routes_between(db, from_code, to_code):
    # Find routes where both stations exist and from appears before to
    pipeline = [
        {'$match': {'stops.station_code': {'$all': [from_code, to_code]}}},
        {'$project': {
            'train_number': 1,
            'train_name': 1,
            'type': 1,
            'stops': 1
        }},
        {'$addFields': {
            'from_index': {
                '$indexOfArray': ['$stops.station_code', from_code]
            },
            'to_index': {
                '$indexOfArray': ['$stops.station_code', to_code]
            }
        }},
        {'$match': {'$expr': {'$lt': ['$from_index', '$to_index']}}},
        {'$project': {
            'train_number': 1,
            'train_name': 1,
            'type': 1,
            'from_stop': {'$arrayElemAt': ['$stops', '$from_index']},
            'to_stop': {'$arrayElemAt': ['$stops', '$to_index']}
        }}
    ]
    return list(db.routes.aggregate(pipeline))

def validate_train_segment(db, train_number, from_code, to_code):
    route = db.routes.find_one({'train_number': train_number})
    if not route:
        return False, 'Train number not found.'
    codes = [stop['station_code'] for stop in route['stops']]
    if from_code not in codes or to_code not in codes:
        return False, 'One of the stations is not on this train.'
    if codes.index(from_code) >= codes.index(to_code):
        return False, 'Train does not travel from source to destination in that order.'
    return True, 'Valid segment.'

def next_stop_info(db, train_number, current_code):
    route = db.routes.find_one({'train_number': train_number})
    if not route:
        return None
    stops = route['stops']
    for i, stop in enumerate(stops):
        if stop['station_code'] == current_code:
            if i + 1 < len(stops):
                return stops[i + 1]
            else:
                return None
    return None

def destination_alerts(db, train_number, current_code):
    # Simple alert: platform change at next station
    next_stop = next_stop_info(db, train_number, current_code)
    if not next_stop:
        return []
    alerts = []
    # If platform differs from current stop's platform, alert
    current_stop = db.routes.find_one({'train_number': train_number, 'stops.station_code': current_code}, {'stops.$': 1})
    if current_stop:
        cur = current_stop['stops'][0]
        if cur.get('platform') != next_stop.get('platform'):
            alerts.append(f"Platform change at {next_stop['station_code']}: from {cur.get('platform')} to {next_stop.get('platform')}")
    return alerts

def simple_ai_guidance(db, train_number, current_code):
    # Rule‑based guidance string
    next_stop = next_stop_info(db, train_number, current_code)
    if not next_stop:
        return 'You are at the final stop of this train.'
    guidance = []
    # Coach position heuristic based on train type
    route = db.routes.find_one({'train_number': train_number})
    if route:
        ttype = route.get('type', '').lower()
        if 'shatabdi' in ttype:
            guidance.append('Coach is likely at the front of the train.')
        elif 'rajdhani' in ttype:
            guidance.append('Coach is likely in the middle of the train.')
        else:
            guidance.append('Coach position is standard.')
    # Boarding side based on platform parity
    platform = next_stop.get('platform')
    if platform and platform.isdigit():
        side = 'left' if int(platform) % 2 == 0 else 'right'
        guidance.append(f'Board from the {side} side at the next station.')
    return ' '.join(guidance)
