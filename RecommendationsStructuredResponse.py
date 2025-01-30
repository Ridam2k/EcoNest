from pydantic import BaseModel
from typing import List, Optional, Dict

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
    
    @classmethod
    def from_dict(cls, data: dict):
        categories = []
        for category_name, rec_list in data['recommendations'].items():
            items = []
            for rec in rec_list:
                details = RecommendationDetails(
                    Implementation=rec['details'].get('Implementation', ''),
                    Cost=rec['details'].get('Cost', ''),
                    Carbon_Reduction=rec['details'].get('Carbon Reduction', ''),
                    Benefits=rec['details'].get('Benefits', ''),
                    Resources=rec['details'].get('Resources', ''),
                    Maintenance=rec['details'].get('Maintenance', None)
                )
                items.append(RecommendationItem(title=rec['title'], details=details))
            categories.append(NewRecommendations(category=category_name, items=items))
        return cls(categories=categories)

    def to_recommendation_dict(self) -> Dict:
        recommendation_dict = {}
        for category in self.categories:
            recommendations = []
            for item in category.items:
                details_dict = {
                    "Cost": item.details.Cost,
                    "Benefits": item.details.Benefits,
                    "Resources": item.details.Resources,
                    "Maintenance": item.details.Maintenance,
                    "Implementation": item.details.Implementation,
                    "Carbon Reduction": item.details.Carbon_Reduction
                }
                recommendations.append({"title": item.title, "details": details_dict})
            recommendation_dict[category.category] = recommendations
        return {"recommendations": recommendation_dict}
