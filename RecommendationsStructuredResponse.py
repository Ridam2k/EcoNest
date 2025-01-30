from pydantic import BaseModel
from typing import List, Optional

class RecommendationDetails(BaseModel):
    Implementation: str  # Detailed steps
    Cost: str  # Specific amount
    Carbon_Reduction: str  # kg/month
    Benefits: str  # List specific benefits
    Resources: str  # What's needed
    Maintenance: Optional[str]  # Requirements, if any

class RecommendationItem(BaseModel):
    title: str  # Recommendation Title
    details: RecommendationDetails

class NewRecommendations(BaseModel):
    category: str  # Current Category OR Next Steps Category
    items: List[RecommendationItem]  # List of recommendations

class Recommendations(BaseModel):
    categories: List[NewRecommendations]