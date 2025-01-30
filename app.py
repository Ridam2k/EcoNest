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

def authenticate_user(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Extract the JWT token from the Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header is missing", "status": "error"}), 401
        
        token = auth_header.split(" ")[1]  # Assuming the header is "Bearer <token>"
        
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
            "user": user_data,
            "access_token": response.session.access_token  
            }), 201
                       
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
        print(response)
        return jsonify({"message": "Login successful",
                        "access_token": response.session.access_token
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
        user_data = supabase.table('users').select("emission_analysis").eq("id", request.user.id).execute().data
        
        if not user_data or not user_data[0].get("emission_analysis"):
            return jsonify({
                "error": "Emission data not found for the user",
                "status": "error"
            }), 404
        
        emission_data = user_data[0]["emission_analysis"]
        
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
        "initial_recommendations": {...},
        "recommendation": "Recommendation title",
        "specific_steps_taken": "Steps taken (optional)"
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
        emission_data = user_data[0]['emission_analysis']
        initial_recommendations = user_data[0]['recommendations']
        
        print("Initial Recommendations from DB: ")
        # print(initial_recommendations)
        print(type(initial_recommendations))

        updated_db_dict, footprint_analysis, implementation_analysis = analyzer.update_progress(
            initial_recommendations,   #from db
            user_input,
            emission_data,
            data['recommendation'],
            data['current_category'],
            specific_steps_taken,
            next_steps
        )
        
        print("Updated Recommendations: ")
        print(updated_db_dict)
        
                
        updated_emission = footprint_analysis['total_monthly_kg']
        
        supabase.table('users').update({
            "carbon_footprint": updated_emission,
            "recommendations": updated_db_dict,
        }).eq("id", request.user.id).execute()
          
        
        response_data = {
            "footprint_analysis": footprint_analysis,
            "recommendations": updated_db_dict,
            "status": "success"
        }
        
        return jsonify({
            "data": response_data,
            "status":200,
            "mimetype": 'application/json'
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
