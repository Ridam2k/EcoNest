from flask import Flask, request, jsonify
from carbon_footprint_analyzer import CarbonFootprintAnalyzer
# from api.carbon_footprint_analyzer import CarbonFootprintAnalyzer
from supabase import create_client, Client
from functools import wraps
import os
from typing import Callable
import json
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
CORS(app)

# print("key")
# print(os.getenv('OPENAI_API_KEY'))

# print(os.getenv('MODEL_NAME'))
# Initialize the analyzer with environment variables
analyzer = CarbonFootprintAnalyzer(
    api_key=os.getenv('OPENAI_API_KEY'),
    model_name=os.getenv('MODEL_NAME', 'o3-mini-2025-01-31'),
    temperature=float(os.getenv('TEMPERATURE', '0.0'))
)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(url, key)

print(os.environ['MODEL_NAME'])

class User:
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username
        }


def convert_postgres_array(array_string: str) -> list:
    # Handle empty array "{}"
    if array_string == "{}":
        return []

    # Remove curly braces and split by commas (handle single-element arrays correctly)
    array_string = array_string.strip("{}")
    if not array_string:
        return []

    return array_string.split(",")

def convert_list_to_postgres_array(items: list) -> str:
    # Join items with commas and wrap in curly braces
    return "{" + ",".join(items) + "}"


def authenticate_user(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Extract the JWT token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header is missing", "status": "error"}), 401

        # Assuming the header is "Bearer <token>"
        token = auth_header.split(" ")[1]

        try:
            # Verify the token and get the user
            user_response = supabase.auth.get_user(token)
            if not user_response:
                return jsonify({"error": "Invalid or expired token", "status": "error"}), 401

            # Attach the user to the request object
            user = user_response.user
            if not user:
                return jsonify({"error": "User not found in token", "status": "error"}), 401

            request.user = user
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e), "status": "error"}), 401
    return wrapper


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

                missing_fields = [
                    field for field in required_fields if field not in data]
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


@app.route('/api/register', methods=['POST'])
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
            "username"  : username,
            "past_actions": {}
        }

        # Step 2: Store user info in the custom 'users' table
        db_response = supabase.table('users').insert(user_data).execute()

        return jsonify({
            "message": "User registered successfully",
            "user": user_data,
            "access_token": response.session.access_token
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 400

# User sign-in


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        response = supabase.auth.sign_in_with_password(
            {"email": email, "password": password})
        return jsonify({"message": "Login successful",
                        "access_token": response.session.access_token,
                        "user_id": response.user.id
                        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401


@app.route('/api/analyze', methods=['POST'])
@validate_request(['user_input'])
@authenticate_user
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

        # Save the result to Supabase
        supabase.table('users').update({
            "user_input": data['user_input'],
            "emission_analysis": result,
            "starting_footprint": result['estimated_monthly_carbon_footprint'],
            "carbon_footprint": result['estimated_monthly_carbon_footprint']
        }).eq("id", request.user.id).execute()

        return jsonify({
            "data": result,
            "status": "success"
        })
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/api/currentStatus', methods=['GET'])
@authenticate_user
def current_status():
    """
    Analyze user's carbon footprint based on their input.

    Expected request body:
    {
        "user_input": "Description of daily behaviors"
    }
    """
    try:
        user_data = supabase.table('users').select().eq("id", request.user.id).execute().data
                
        result = user_data[0]

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
@validate_request(['budget', 'categories'])
@authenticate_user
def get_recommendations():
    """
    Get eco-friendly recommendations based on analysis.

    Expected request body:
    {
        "budget": "200 USD",
        "categories": "Category1, Category2"
    }
    """
    try:
        data = request.get_json()

        # Fetch the user's emission data from the `users` table
        user_data = supabase.table('users').select(
            "emission_analysis").eq("id", request.user.id).execute().data

        if not user_data or not user_data[0].get("emission_analysis"):
            return jsonify({
                "error": "Emission data not found for the user",
                "status": "error"
            }), 404

        emission_data = user_data[0]["emission_analysis"]
        
        print("Emission Data: ")
        print(type(emission_data))
        
        # return jsonify({
        #     "data": "okay",
        #     "status": "success"
        # })
        
        result = analyzer.get_recommendations(
            emission_data,
            data['budget'],
            data['categories']
        )

        # Save the result to Supabase
        supabase.table('users').update({
            "recommendations": result
        }).eq("id", request.user.id).execute()

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
# @validate_request(['recommendation', 'current_category'], optional=['specific_steps_taken', 'next_steps'])
@authenticate_user
def update_progress():
    """
    Update progress based on completed recommendations.

    Expected request body:
    {
        "recommendation": "Herb Gardening Kit",
        "current_category": "Plant-Based Solutions"
        "next_steps": "Small Appliance Upgrades" (optional)
        "specific_steps_taken": "Steps taken" (optional)
    }
    """
    try:
        data = request.get_json()

        # Check for required fields
        required_fields = ['recommendation', 'current_category']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Missing required field: {field}",
                    "status": "error"
                }), 400

        specific_steps_taken = data.get('specific_steps_taken', "")
        next_steps = data.get('next_steps', "")
        
        user_data = supabase.table('users').select().eq("id", request.user.id).execute().data
        
        
        user_input = user_data[0]['user_input']
        current_footprint = user_data[0]['carbon_footprint']
        emission_data = user_data[0]['emission_analysis']
        initial_recommendations = user_data[0]['recommendations']
        past_actions_str = user_data[0]['past_actions']
        
        print(type(past_actions_str))
        # print(past_actions_str)
        
        past_actions = convert_postgres_array(past_actions_str)
        print(past_actions)
    
        updated_db_dict, footprint_analysis, implementation_analysis, new_actions = analyzer.update_progress(
            initial_recommendations,   #from db
            user_input,
            current_footprint,
            data['recommendation'],
            data['current_category'],
            specific_steps_taken,
            next_steps
        )
                
        updated_emission = footprint_analysis['total_monthly_kg']
        past_actions = past_actions + new_actions
        
        print("updated past actions")
        print(past_actions)
        
        updated_past_actions_str = convert_list_to_postgres_array(past_actions)
        
        supabase.table('users').update({
            "carbon_footprint": updated_emission,
            "recommendations": updated_db_dict,
            "past_actions": updated_past_actions_str
        }).eq("id", request.user.id).execute()

        response_data = {
            "footprint_analysis": footprint_analysis,
            "implementation_analysis": implementation_analysis,
            "recommendations": updated_db_dict,
            "past_actions": updated_past_actions_str, 
            "status": "success"
        }
        
        return jsonify({
            "data": response_data,
            # "data": "okay",
            "status":200,
            "mimetype": 'application/json'
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500


@app.route('/api/internal/products', methods = ['POST'])
# @validate_request(['user_input', 'recommendations'])
@authenticate_user
def get_products():
    try:
        # Fetch the user's data from the `users` table
        user_data = supabase.table('users').select().eq("id", request.user.id).execute().data[0]
        
        user_input = user_data["user_input"]
        recommendations = user_data["recommendations"]
        
        print("User input", user_input)
        print(recommendations, type(recommendations))
        
        products = analyzer.get_sponsored_products(user_input, recommendations)
        return jsonify({
            "data": products,
            "status": 200
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
    app.run(host='0.0.0.0', port=port, debug=os.getenv(
        'FLASK_DEBUG', 'False').lower() == 'true')
