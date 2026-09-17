from typing import List, Optional
from pydantic import BaseModel, EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: "UserSummary"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    role_names: List[str] = []
    assigned_mine_ids: List[int] = []

class UserSummary(BaseModel):
    id: int
    email: str
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    roles: List[str] = []
    assigned_mine_ids: List[int] = []

    class Config:
        from_attributes = True

class UserDetail(UserBase):
    id: int
    is_superuser: bool
    roles: List[str] = []
    assigned_mine_ids: List[int] = []

    class Config:
        from_attributes = True

TokenResponse.model_rebuild()
