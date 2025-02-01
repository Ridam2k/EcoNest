import openai
import json
from typing import Dict, List, Optional, Union, Any, Tuple
import ast
import json
import re
import UpdatedStructuredResponse as usr
import RecommendationsStructuredResponse as rsr
import AnalysisStructuredResponse as asr


# Example user input
# user_input = '''I drive a 2013 Honda accord 15 miles to and from my work to my house. 
# I have a family of 4 with my wife and 2 kids, all of us are non-vegetarians. 
# We have a double door refrigerator and we live in Atlanta in a 2b2b appartment.'''

emission_data = {"items": [
    {
        "category": "Transportation",
        "emission_range": "150-200 kg",
        "name": "Daily commute to work",
        "additional_info": "The user drives a 2013 Honda Accord 15 miles to and from work."
    },
    {
        "category": "Food",
        "emission_range": "400-600 kg",
        "name": "Non-vegetarian diet",
        "additional_info": "The user and their family of 4 are all non-vegetarians."
    },
    {
        "category": "Home Energy",
        "emission_range": "200-300 kg",
        "name": "Home appliances usage",
        "additional_info": "The user lives in a 2b2b apartment in Atlanta with a double door refrigerator."
    }
    ],
    "estimated_monthly_carbon_footprint": "900 kg"
}
# initial_recommendations ={'Plant-Based Solutions': [{'title': 'Indoor Air-Purifying Plants', 'details': {'Implementation': 'Purchase low-maintenance indoor plants like Snake Plant and Spider Plant. These plants are known for their air-purifying qualities.', 'Cost': '$30-$50', 'Carbon Reduction': '2-5 kg/month', 'Benefits': 'Improved indoor air quality, aesthetic appeal', 'Resources': 'Indoor space with indirect sunlight', 'Maintenance': 'Watering once a week'}}], 'Waste Reduction Initiatives': [{'title': 'Herb Garden Starter Kit', 'details': {'Implementation': 'Start growing your own herbs in your kitchen. This can reduce the carbon footprint associated with transporting herbs from the farm to your plate.', 'Cost': '$20-$40', 'Carbon Reduction': '5-10 kg/month', 'Benefits': 'Fresh herbs for cooking, reduced grocery costs', 'Resources': 'A sunny windowsill in your kitchen', 'Maintenance': 'Regular watering and pruning'}}, {'title': 'Composting Starter Kit', 'details': {'Implementation': 'Start composting your kitchen waste. This can significantly reduce the amount of waste that goes to the landfill.', 'Cost': '$50-$100', 'Carbon Reduction': '10-20 kg/month', 'Benefits': 'Reduced waste, rich compost for plants', 'Resources': 'A small outdoor space or a dedicated indoor bin', 'Maintenance': 'Regular turning of compost'}}, {'title': 'Reusable Alternatives', 'details': {'Implementation': 'Replace single-use items in your home with reusable alternatives. This includes food storage containers, shopping bags, and water bottles.', 'Cost': '$30-$60', 'Carbon Reduction': '10-15 kg/month', 'Benefits': 'Reduced waste, cost savings over time', 'Resources': 'Initial investment in reusable items', 'Maintenance': 'Regular cleaning and care'}}]}



class CarbonFootprintAnalyzer:
    def __init__(self, api_key: str, model_name: str = "gpt-4", temperature: float = 0.0):
        """
        Initialize the Carbon Footprint Analyzer.
        
        Args:
            api_key (str): OpenAI API key
            model_name (str): Model to use for analysis (default: "gpt-4")
            temperature (float): Temperature setting for generation (default: 0.0)
        """
        # print(api_key)
        self.client = openai.Client(api_key=api_key)
        self.model_name = model_name
        self.temperature = temperature
        self.conversation = [
            {
                "role": "system",
                "content": "You are an assistant helping to estimate carbon footprints and provide eco-friendly recommendations and updating them according to user progress."
            }
        ]

    def _get_analysis_prompt(self, user_input: str) -> str:
        """Generate the analysis prompt template."""
        with open("Prompts/onboarding.txt", "r") as file:
            text = file.read()
            
        return text.format(user_input=user_input)

    def _get_recommendations_prompt(self, budget: str, categories: str) -> str:
        """Generate the recommendations prompt template."""
        with open("Prompts/recommendations.txt", "r") as file:
            text = file.read()
            
        return text.format(budget=budget, categories=categories)
        

    def _get_updates_prompt(self, recommendation: str, current_category : str,initial_recommendations, specific_steps_taken: Optional[str]= None, next_steps: Optional[str] = None) -> str:
        """Generate the updates prompt template."""
        with open("Prompts/updates.txt", "r") as file:
            text = file.read()
            
        return text.format(recommendation=recommendation, current_category = current_category, steps_taken=specific_steps_taken, next_steps=next_steps, previous_recommendations=initial_recommendations)
    
    @staticmethod
    def update_recommendations(db_dict: Dict, structured_response_str: str, completed_recommendation: str, completed_category: str) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        print("DB String:", db_dict)
        print("Structured Response:", structured_response_str)
        print("Completed Recommendation:", completed_recommendation)
        print("Completed Category:", completed_category)
        
        structured_response = json.loads(structured_response_str)
        
        # Extract relevant information from structured_response
        footprint_analysis = structured_response['updated_footprint']
        implementation_analysis = structured_response['implementation_analysis']
        new_actions = []
        
        if footprint_analysis['recommendation_completed']:
            # Remove the completed recommendation from the db_dict
            new_actions.append(completed_recommendation)
            
            if completed_category in db_dict['recommendations']:
                db_dict['recommendations'][completed_category] = [
                    item for item in db_dict['recommendations'][completed_category] 
                    if item['title'] != completed_recommendation
                ]
                
                # Remove the category if it's empty
                if not db_dict['recommendations'][completed_category]:
                    del db_dict['recommendations'][completed_category]

        # Add the new recommendations if any
        if structured_response['new_recommendations']:
            new_category = structured_response['new_recommendations']['category']
            print(new_category)
            new_items = structured_response['new_recommendations']['items']
            print(new_items)
            
            if new_category in db_dict['recommendations']:
                db_dict['recommendations'][new_category].extend(new_items)
            else:
                db_dict['recommendations'][new_category] = new_items
        
        print("COMPLETED CONVERSION")
        
        return db_dict, footprint_analysis, implementation_analysis, new_actions
    
    @staticmethod
    def _format_analysis_response(response: str) -> Dict:
        """Format the analysis response."""
        data_parts = response.split('\n\n')
        json_str = data_parts[0]
        
        parsed_data = json.loads(json_str)
        
        if len(data_parts) > 1:
            footprint = data_parts[1]
        else:
            footprint = parsed_data['estimated_monthly_carbon_footprint']
            
        parsed_data['estimated_monthly_carbon_footprint'] = footprint
        return parsed_data

    def analyze_footprint(self, user_input: str) -> Dict:
        """
        Analyze the user's carbon footprint based on their input.
        
        Args:
            user_input (str): User's description of their daily behaviors
            
        Returns:
            Dict: Analyzed carbon footprint data
        """
        analysis_prompt = self._get_analysis_prompt(user_input)
        
        self.conversation.append({"role": "user", "content": "Please analyze the user's carbon footprint based on their input."})
        self.conversation.append({"role": "assistant", "content": f"Making API call with the following prompt: {analysis_prompt}"})

        
        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=self.conversation,
            response_format=asr.CarbonFootprintReport
        )
        

        analysis_response = response.choices[0].message.content
        print("Analysis Response:", analysis_response)
        emission_data = asr.CarbonFootprintReport.transform_to_custom_format(json.loads(analysis_response))
        
        return emission_data

    def get_recommendations(self, emission_data: Dict, budget: str, categories: str) -> Dict:
        """
        Get eco-friendly recommendations based on the analysis.
        
        Args:
            emission_data (Dict): Previous analysis results
            budget (str): User's monthly budget
            categories (str): Selected categories for recommendations
            
        Returns:
            Dict: Recommendations data
        """
        recommendations_prompt = self._get_recommendations_prompt(budget, categories)
        
        self.conversation.append({"role": "assistant", "content": f"User Emission Analysis: {emission_data}"})
        self.conversation.append({"role": "user", "content": "Based on the analysis, provide eco-friendly recommendations."})
        self.conversation.append({"role": "assistant", "content": f"Making API call with the following prompt: {recommendations_prompt}"})
        
        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=self.conversation,
            response_format=rsr.Recommendations
        )
        
        recommendations_response = response.choices[0].message.content
        print("Recommendations Response:", recommendations_response)
        
        # Parse the string response and convert it to the desired dictionary
        parsed_response = rsr.Recommendations.parse_raw(recommendations_response)
        recommendations_dict = parsed_response.to_recommendation_dict()
        return recommendations_dict

    def update_progress(self, initial_recommendations: str, user_input: str, emission_data: Dict,
                        recommendation: str, current_category: str,
                        specific_steps_taken: Optional[str] = None, next_steps: Optional[str] = None) -> Dict:
        """
        Update progress based on completed recommendations.
        """
        updates_prompt = self._get_updates_prompt(recommendation, current_category = current_category,initial_recommendations= initial_recommendations, specific_steps_taken=specific_steps_taken, next_steps=next_steps )
        
        self.conversation.append({"role": "assistant", "content": f"User analysis: {emission_data}"})
        self.conversation.append({"role": "assistant", "content": f"Recommendations to the user: {initial_recommendations}"})
        self.conversation.append({"role": "user", "content": "Based on the user progress, update your recommendations."})
        self.conversation.append({"role": "assistant", "content": f"Making API call with the prompt: {updates_prompt}"})

        
        response = self.client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=self.conversation,
            response_format=usr.UpdatedStructuredResponse
        )
        
        response_content = response.choices[0].message.content
        print("Updates Response:", response_content)
        # print(type(response_content))
        
        progress = response_content
        
        
        db_string = initial_recommendations 
        updated_db_dict, footprint_analysis, implementation_analysis, new_actions = self.update_recommendations(db_string, progress, recommendation, current_category)
        # updated_db_string = json.dumps(updated_db_dict)

        print("Updated DB String:", updated_db_dict)
        print("\nFootprint Analysis:", footprint_analysis)
        print("\nImplementation Analysis:", implementation_analysis)
        
        
        return updated_db_dict, footprint_analysis, implementation_analysis, new_actions




def main():
    # Example usage
    # api_key = "your-api-key"
    analyzer = CarbonFootprintAnalyzer(openai.api_key)
    
    # Example user input
    user_input = '''I drive a 2013 Honda accord 15 miles to and from my work to my house. 
    I have a family of 4 with my wife and 2 kids, all of us are non-vegetarians. 
    We have a double door refrigerator and we live in Atlanta in a 2b2b appartment.'''
    
    # Analyze carbon footprint
    emission_data = analyzer.analyze_footprint(user_input)
    print("Emission Analysis:", emission_data)
    
  #   emission_data = {"items": [
  #      {
  #        "category": "Transportation",
  #        "emission_range": "150-200 kg",
  #        "name": "Daily commute to work",
  #        "additional_info": "The user drives a 2013 Honda Accord 15 miles to and from work."
  #      },
  #      {
  #        "category": "Food",
  #        "emission_range": "400-600 kg",
  #        "name": "Non-vegetarian diet",
  #        "additional_info": "The user and their family of 4 are all non-vegetarians."
  #      },
  #      {
  #        "category": "Home Energy",
  #        "emission_range": "200-300 kg",
  #        "name": "Home appliances usage",
  #        "additional_info": "The user lives in a 2b2b apartment in Atlanta with a double door refrigerator."
  #      }
  #    ],
  #    "estimated_monthly_carbon_footprint": "900 kg"
  #  }
    
    # Get recommendations
    recommendations = analyzer.get_recommendations(
        emission_data,
        budget="200 USD",
        categories="Plant-Based Solutions, Waste Reduction Initiatives"
    )
    print("Recommendations:", recommendations)
    
    # recommendations ={'Plant-Based Solutions': [{'title': 'Indoor Air-Purifying Plants', 'details': {'Implementation': 'Purchase low-maintenance indoor plants like Snake Plant and Spider Plant. These plants are known for their air-purifying qualities.', 'Cost': '$30-$50', 'Carbon Reduction': '2-5 kg/month', 'Benefits': 'Improved indoor air quality, aesthetic appeal', 'Resources': 'Indoor space with indirect sunlight', 'Maintenance': 'Watering once a week'}}], 'Waste Reduction Initiatives': [{'title': 'Herb Garden Starter Kit', 'details': {'Implementation': 'Start growing your own herbs in your kitchen. This can reduce the carbon footprint associated with transporting herbs from the farm to your plate.', 'Cost': '$20-$40', 'Carbon Reduction': '5-10 kg/month', 'Benefits': 'Fresh herbs for cooking, reduced grocery costs', 'Resources': 'A sunny windowsill in your kitchen', 'Maintenance': 'Regular watering and pruning'}}, {'title': 'Composting Starter Kit', 'details': {'Implementation': 'Start composting your kitchen waste. This can significantly reduce the amount of waste that goes to the landfill.', 'Cost': '$50-$100', 'Carbon Reduction': '10-20 kg/month', 'Benefits': 'Reduced waste, rich compost for plants', 'Resources': 'A small outdoor space or a dedicated indoor bin', 'Maintenance': 'Regular turning of compost'}}, {'title': 'Reusable Alternatives', 'details': {'Implementation': 'Replace single-use items in your home with reusable alternatives. This includes food storage containers, shopping bags, and water bottles.', 'Cost': '$30-$60', 'Carbon Reduction': '10-15 kg/month', 'Benefits': 'Reduced waste, cost savings over time', 'Resources': 'Initial investment in reusable items', 'Maintenance': 'Regular cleaning and care'}}]}

    
    # Update progress
    progress = analyzer.update_progress(
        recommendations,
        recommendation="Start a Herb Garden",
        specific_steps_taken="Purchased and planted basil and mint"
    )
    print("Progress Update:", progress)
    
# if __name__ == "__main__":
#     main()