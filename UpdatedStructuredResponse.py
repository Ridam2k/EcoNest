from pydantic import BaseModel
from typing import List, Optional


class UpdatedFootprint(BaseModel):
    total_monthly_kg: float  # New total monthly carbon footprint
    reduction_achieved: float  # Actual reduction achieved from the completed recommendation
    percent_improvement: float  # Percentage improvement from initial footprint
    recommendation_completed: bool  # Whether the recommendation was fully completed


class ImplementationAnalysis(BaseModel):
    completeness: float  # Percentage of recommendation steps completed (if partial)
    remaining_potential: float  # Remaining potential reduction in kg
    additional_steps: List[str]  # Empty array if fully complete, otherwise remaining steps


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


class UpdatedStructuredResponse(BaseModel):
    updated_footprint: UpdatedFootprint
    implementation_analysis: ImplementationAnalysis
    new_recommendations: Optional[NewRecommendations] = None  # Optional; only included if applicable
