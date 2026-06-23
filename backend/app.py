import os
import datetime
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
import pytesseract
from PIL import Image
import io
# Local utilities for offline railway data
from utils.loader import initialise_offline_data
from utils import search

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET', 'dev_secret_key')
MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/railmate')

# MongoDB Connection — non-fatal: chat/intent works without Mongo
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    db = client['railmate']
    users_collection = db.users
    tickets_collection = db.tickets
    print('[DB] MongoDB connected successfully')
except Exception as e:
    print(f'[DB] MongoDB unavailable: {e}. Auth/ticket routes will fail, AI chat will still work.')
    client = None
    db = None
    users_collection = None
    tickets_collection = None

# JWT Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Yathrava Backend"}), 200

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing data'}), 400
        
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists'}), 400
        
    hashed_password = generate_password_hash(data['password'])
    
    user_id = users_collection.insert_one({
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password,
        'created_at': datetime.datetime.utcnow()
    }).inserted_id
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing data'}), 400
        
    user = users_collection.find_one({'email': data['email']})
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'token': token, 'user': {'name': user['name'], 'email': user['email']}}), 200

# Mocked Train / Ticket API
@app.route('/api/tickets/pnr/<pnr_number>', methods=['GET'])
@token_required
def get_pnr_status(current_user, pnr_number):
    # Mocking PNR response
    if len(pnr_number) != 10:
        return jsonify({'message': 'Invalid PNR format. Must be 10 digits.'}), 400
        
    mock_ticket = {
        "pnr": pnr_number,
        "train_number": "12621",
        "train_name": "TAMIL NADU EXP",
        "boarding_station": "MAS (Chennai Central)",
        "destination_station": "NDLS (New Delhi)",
        "date_of_journey": (datetime.datetime.now() + datetime.timedelta(days=2)).strftime('%Y-%m-%d'),
        "passengers": [
            {"name": "Passenger 1", "age": 45, "status": "CNF", "coach": "B4", "seat": "32", "berth": "SU"}
        ],
        "chart_status": "Prepared"
    }
    
    return jsonify(mock_ticket), 200

# Phase 2: AI Capabilities
@app.route('/api/vision/scan', methods=['POST'])
def vision_scan():
    if 'image' not in request.files:
        return jsonify({'message': 'No image uploaded'}), 400
    
    file = request.files['image']
    try:
        img = Image.open(file.stream)
        # Attempt real OCR
        text = pytesseract.image_to_string(img)
        # Simple extraction logic based on the text
        if "CHENNAI" in text.upper():
            return jsonify({'message': 'Recognized Station: Chennai Central. You are at the correct boarding point.', 'raw_text': text}), 200
        elif "12621" in text:
            return jsonify({'message': 'Recognized Train: 12621 Tamil Nadu Exp. You are boarding the correct train!', 'raw_text': text}), 200
        else:
            return jsonify({'message': 'OCR completed. Could not automatically determine station or train.', 'raw_text': text}), 200
    except pytesseract.TesseractNotFoundError:
        # Fallback if tesseract is not installed on the system
        return jsonify({
            'message': '[Mocked OCR] Recognized Station: Chennai Central. You are boarding the correct train!',
            'raw_text': 'CHENNAI CENTRAL'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error processing image: {str(e)}'}), 500

@app.route('/api/chat/intent', methods=['POST'])
def chat_intent():
    data = request.get_json()
    if not data or not data.get('text'):
        return jsonify({'response': 'I did not catch that.', 'lang': 'en-IN'}), 400
    
    user_text = data['text']
    user_text_lower = user_text.lower().strip()
    
    # 1. Detect language
    # Check for Tamil characters (Unicode block 0B80-0BFF)
    is_tamil = any(ord(char) >= 0x0B80 and ord(char) <= 0x0BFF for char in user_text)
    
    # Check for Tanglish keywords
    tanglish_keywords = ['enga', 'iruku', 'irukku', 'eppo', 'eranganum', 'iranganum', 'sollu', 'adutha', 'enna', 'solla', 'porathu', 'nagarum', 'vanakkam', 'varum']
    is_tanglish = any(kw in user_text_lower for kw in tanglish_keywords)
    
    detected_lang = 'english'
    tts_lang = 'en-IN'
    if is_tamil:
        detected_lang = 'tamil'
        tts_lang = 'ta-IN'
    elif is_tanglish:
        detected_lang = 'tanglish'
        tts_lang = 'en-IN' # Indian English engine speaks Tanglish transliteration well

    # 2. Match intents
    intent = 'unknown'
    if any(x in user_text_lower for x in ['where', 'location']) or any(x in user_text_lower for x in ['எங்கே', 'எங்க', 'இருக்கு', 'இருக்கின்றது']) or 'train enga' in user_text_lower:
        intent = 'train_location'
    elif 'next' in user_text_lower or 'அடுத்த' in user_text_lower or 'adutha' in user_text_lower:
        intent = 'next_station'
    elif any(x in user_text_lower for x in ['get down', 'get off', 'arrive', 'reach', 'when', 'down']) or any(x in user_text_lower for x in ['இறங்க', 'எப்போது', 'எப்போ', 'இறங்கணும்', 'eranganum', 'iranganum']):
        intent = 'get_down'
    elif 'platform' in user_text_lower or 'பிளாட்பார்ம்' in user_text_lower:
        intent = 'platform'
    elif any(x in user_text_lower for x in ['emergency', 'help', 'danger', 'sos', 'safety']) or any(x in user_text_lower for x in ['அபாயம்', 'உதவி', 'காப்பாத்துங்க', 'விபத்து']):
        intent = 'emergency'
    elif any(x in user_text_lower for x in ['hello', 'hi', 'வணக்கம்', 'vanakkam']):
        intent = 'greeting'

    # Responses dictionary
    responses = {
        'english': {
            'greeting': 'Hello! I am Yathrava, your bilingual AI travel assistant. How can I assist you with your journey today?',
            'train_location': 'Your train, 12639 - Brindavan Express, is currently running on time and has just departed Jolarpettai.',
            'next_station': 'The next upcoming station is Kuppam, expected in about 15 minutes.',
            'get_down': 'You should get down at Bangalore Cantt station. The remaining time is approximately 45 minutes.',
            'platform': 'Your train is scheduled to arrive at Platform number 4 of your destination.',
            'emergency': '🚨 Emergency mode activated! I am notifying the Railway Protection Force (RPF) and triggering safety alerts.',
            'unknown': 'I am your Yathrava assistant. You can ask me about train location, next station, when to get down, or platform number in English, Tamil, or Tanglish.'
        },
        'tamil': {
            'greeting': 'வணக்கம்! நான் யாத்ரவா AI பயண உதவியாளர். உங்கள் பயணத்தைப் பற்றி நான் உங்களுக்கு எவ்வாறு உதவட்டும்?',
            'train_location': 'உங்கள் ரயில், 12639 - பிருந்தாவன் எக்ஸ்பிரஸ், தற்போது சரியான நேரத்திற்கு இயங்குகிறது மற்றும் ஜோலார்பேட்டையிலிருந்து கிளம்பியுள்ளது.',
            'next_station': 'அடுத்த நிலையம் குப்பம் ஆகும், இது சுமார் 15 நிமிடங்களில் வரவிருக்கிறது.',
            'get_down': 'நீங்கள் பெங்களூர் காண்ட் நிலையத்தில் இறங்க வேண்டும். இன்னும் 45 நிமிடங்கள் உள்ளன.',
            'platform': 'உங்கள் ரயில் உங்கள் சேருமிடத்தின் பிளாட்பார்ம் எண் 4-ல் வந்து சேரும்.',
            'emergency': '🚨 அவசர உதவி முறை செயல்படுத்தப்பட்டது! நான் இரயில்வே பாதுகாப்பு படைக்கு (RPF) தகவல் தெரிவிக்கிறேன்.',
            'unknown': 'நான் உங்கள் யாத்ரவா உதவியாளர். உங்கள் ரயில் எங்கே இருக்கிறது, அடுத்த நிலையம் என்ன, எப்போது இறங்க வேண்டும், அல்லது பிளாட்பார்ம் எண் பற்றி நீங்கள் என்னிடம் கேட்கலாம்.'
        },
        'tanglish': {
            'greeting': 'Vanakkam! Naan Yathrava AI travel assistant. Unga journey pathi enna help venum sollunga?',
            'train_location': 'Unga train, 12639 - Brindavan Express, eppo correct time la oditu iruku. Jolarpettai station la irundhu eppo thaan kelambiruku.',
            'next_station': 'Next station Kuppam, innum 15 mins la vandhurum.',
            'get_down': 'Neenga Bangalore Cantt station la eranganum. Innum 45 mins time iruku.',
            'platform': 'Unga train expected ah Platform number 4 la vandhu nikkum.',
            'emergency': '🚨 Emergency mode active! RPF force ku immediate ah message anupuren.',
            'unknown': 'Naan unga Yathrava assistant. Train location, next station, eppo eranganum, illana platform number pathi Tamil, English, or Tanglish la kelunga.'
        }
    }

    reply = responses[detected_lang][intent]
    
    action = "TRIGGER_SOS" if intent == 'emergency' else None
    
    return jsonify({'response': reply, 'lang': tts_lang, 'action': action}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
