from pydantic import BaseModel
from typing import List, Optional, Dict

class Item(BaseModel):
    category: str  # Category name
    emission_range: str  # Emission range in kg
    name: str  # Descriptive name of the behavior
    additional_info: Optional[str]  # Any extra details provided, if any

class CarbonFootprintReport(BaseModel):
    items: List[Item]  # List of behavioral items
    estimated_monthly_carbon_footprint: str  # Estimated carbon footprint in kg
    
    def transform_to_custom_format(self) -> Dict:
        # Transformation logic to adjust category names and details as needed
        transformed_items = []
        for item in self['items']:
            new_item = {
                "category": item['category'],
                "emission_range": item['emission_range'],
                "name": item['name'],
                "additional_info": item['additional_info']
            }
            transformed_items.append(new_item)
        return {
            "items": transformed_items,
            "estimated_monthly_carbon_footprint": self['estimated_monthly_carbon_footprint']
        }
