from typing import List
from pydantic import BaseModel
import json

class SponsoredProduct(BaseModel):
    id: str
    name: str
    vendor: str
    location: str
    description: str
    price: float
    carbonReduction: str
    maintenance: str

class SponsoredCategory(BaseModel):
    category_name: str
    products: List[SponsoredProduct]

class SponsoredProductsResponse(BaseModel):
    plant_based_solutions: List[SponsoredProduct]
    daily_habit_modifications: List[SponsoredProduct]
    waste_reduction_initiatives: List[SponsoredProduct]
    small_appliance_upgrades: List[SponsoredProduct]
    renewable_energy :  List[SponsoredProduct]
    
    def to_dict(self) -> dict:
        categories = [
            SponsoredCategory(
                category_name="Plant-Based Solutions",
                products=self.plant_based_solutions
            ),
            SponsoredCategory(
                category_name="Daily Habit Modifications",
                products=self.daily_habit_modifications
            ),
            SponsoredCategory(
                category_name="Waste Reduction Initiatives",
                products=self.waste_reduction_initiatives
            ),
            SponsoredCategory(
                category_name="Small Appliance Upgrades",
                products=self.small_appliance_upgrades
            )
        ]
        # Convert to nested dict
        return {category.category_name: [product.dict() for product in category.products] for category in categories}

    def to_json_string(self) -> str:
        return json.dumps(self.to_dict(), indent=4)
    
    