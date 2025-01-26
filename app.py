from flask import Flask, request, jsonify
from carbon_footprint_analyzer import CarbonFootprintAnalyzer
from supabase import create_client, Client
# from supafunc import SyncFunctionsClient
from functools import wraps
import os
from typing import Callable
import json

app = Flask(__name__)

# print("key")
# print(os.getenv('OPENAI_API_KEY'))

# print(os.getenv('MODEL_NAME'))
# Initialize the analyzer with environment variables
analyzer = CarbonFootprintAnalyzer(
    # api_key=os.getenv('OPENAI_API_KEY'),
    # api_key="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",
    api_key="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",
    model_name=os.getenv('MODEL_NAME', 'gpt-4'),
    temperature=float(os.getenv('TEMPERATURE', '0.0'))
)

url = "https://ivszphjesvnhsxjqgssb.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2c3pwaGplc3ZuaHN4anFnc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4NDg3NjIsImV4cCI6MjA1MzQyNDc2Mn0.NOoYUkUBDVTEZpFwUh5U5rwITLBIpCKfVbG8i94RcQc"
supabase: Client = create_client(url, key)

class User:
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username
        }

def validate_request(required_fields: list) -> Callable:
    """
    Decorator to validate request body fields.
    
    Args:
        required_fields (list): List of required fields in the request body
    """
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                data = request.get_json()
                if not data:
                    return jsonify({
                        "error": "Request body is required",
                        "status": "error"
                    }), 400

                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        "error": f"Missing required fields: {', '.join(missing_fields)}",
                        "status": "error"
                    }), 400

                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({
                    "error": str(e),
                    "status": "error"
                }), 400
        return wrapper
    return decorator

# User registration
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    username = data.get('username')
    
    try:
        response = supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        
        # Extract relevant user information
        user_data = {
            "id": response.user.id,
            "email": email,
            "username"  : username
        }
        
        # Step 2: Store user info in the custom 'users' table
        db_response = supabase.table('users').insert(user_data).execute()
        
        return jsonify({
            "message": "User registered successfully",
            "user": user_data}), 201
                       
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
# User sign-in
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    try:
        response = supabase.auth.sign_in_with_password({"email": email, "password": password})
        return jsonify({"message": "Login successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route('/api/analyze', methods=['POST'])
@validate_request(['user_input'])
def analyze_footprint():
    """
    Analyze user's carbon footprint based on their input.
    
    Expected request body:
    {
        "user_input": "Description of daily behaviors"
    }
    """
    try:
        data = request.get_json()
        result = analyzer.analyze_footprint(data['user_input'])
        
        return jsonify({
            "data": result,
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/recommendations', methods=['POST'])
@validate_request(['emission_data', 'budget', 'categories'])
def get_recommendations():
    """
    Get eco-friendly recommendations based on analysis.
    
    Expected request body:
    {
        "emission_data": {...},
        "budget": "200 USD",
        "categories": "Category1, Category2"
    }
    """
    try:
        data = request.get_json()
        result = analyzer.get_recommendations(
            data['emission_data'],
            data['budget'],
            data['categories']
        )
        
        return jsonify({
            "data": result,
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/progress', methods=['POST'])
@validate_request(['initial_recommendations', 'recommendation'])
def update_progress():
    """
    Update progress based on completed recommendations.
    
    Expected request body:
    {
        "initial_recommendations": {...},
        "recommendation": "Recommendation title",
        "specific_steps_taken": "Steps taken (optional)"
    }
    """
    try:
        data = request.get_json()
        result = analyzer.update_progress(
            data['initial_recommendations'],
            data['recommendation'],
            data.get('specific_steps_taken')  # Optional field
        )
        
        return jsonify({
            "data": result,
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "message": "Carbon Footprint Analysis API is running"
    })

def create_app():
    """Create and configure the Flask application."""
    # Additional app configuration can be added here
    return app

if __name__ == "__main__":
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true')
