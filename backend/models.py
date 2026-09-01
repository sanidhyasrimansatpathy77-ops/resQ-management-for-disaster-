from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class HazardCategory(str, Enum):
    FLOOD = 'Flood / Waterlogging'
    STRUCTURAL = 'Structural Damage / Building Collapse'
    FIRE = 'Fire / Wildfire / Smoke'
    LANDSLIDE = 'Landslide / Mudslide'
    ELECTRICAL = 'Downed Powerlines / Electrical Hazard'
    ROAD_BLOCK = 'Road Obstruction / Debris'
    OTHER = 'Other Hazard'

class SeverityLevel(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    CRITICAL = 'CRITICAL'

class IncidentStatus(str, Enum):
    PENDING = 'PENDING'
    VERIFIED = 'VERIFIED'
    DISPATCHED = 'DISPATCHED'
    EN_ROUTE = 'EN_ROUTE'
    ON_SCENE = 'ON_SCENE'
    RESOLVED = 'RESOLVED'
    FLAGGED_FALSE_ALARM = 'FLAGGED_FALSE_ALARM'

class AIAnalysisResult(BaseModel):
    hazard_category: HazardCategory
    severity: SeverityLevel
    confidence: float = Field(..., ge=0.0, le=1.0, description='Classification confidence score (0-1)')
    is_real_disaster: bool = Field(..., description='True if real emergency, False if false alarm/hoax/normal scene')
    authenticity_score: float = Field(..., ge=0.0, le=100.0, description='Authenticity confidence (0-100)')
    false_alarm_reason: Optional[str] = None
    visual_features: List[str] = Field(default_factory=list, description='Key visual features that drove the classification')
    recommended_units: List[str] = Field(default_factory=list, description='Recommended first responder unit types')
    damage_assessment: str = Field('', description='Short descriptive summary of visual damage')
    safety_instructions: List[str] = Field(default_factory=list, description='Immediate survival/safety recommendations for victims')

class IncidentCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    reporter_name: Optional[str] = 'Anonymous Citizen'
    reporter_phone: Optional[str] = None
    trapped_count: int = 0
    needs_medical: bool = False
    needs_boat: bool = False
    has_elderly_or_infants: bool = False
    notes: Optional[str] = None

class Incident(BaseModel):
    id: str
    created_at: str
    updated_at: str
    latitude: float
    longitude: float
    address: str
    image_url: str
    thumbnail_url: Optional[str] = None
    hazard_category: HazardCategory
    severity: SeverityLevel
    status: IncidentStatus
    is_real_disaster: bool
    authenticity_score: float
    confidence: float
    visual_features: List[str]
    recommended_units: List[str]
    damage_assessment: str
    safety_instructions: List[str]
    reporter_name: str
    reporter_phone: Optional[str] = None
    trapped_count: int = 0
    needs_medical: bool = False
    needs_boat: bool = False
    has_elderly_or_infants: bool = False
    notes: Optional[str] = None
    assigned_unit: Optional[str] = None
    responder_eta_minutes: Optional[int] = None
    responder_distance_km: Optional[float] = None
    responder_notes: Optional[str] = None

class DispatchUpdate(BaseModel):
    status: IncidentStatus
    assigned_unit: Optional[str] = None
    responder_eta_minutes: Optional[int] = None
    responder_notes: Optional[str] = None

class LiveClassificationRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    api_key: Optional[str] = None

class APIKeyConfig(BaseModel):
    api_key: str
