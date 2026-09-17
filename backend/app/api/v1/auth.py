from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.authz import get_current_active_user, get_user_roles, get_user_assigned_mine_ids, require_roles
from app.core.permissions import RoleEnum
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserSummary, UserCreate, UserDetail
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT bearer token."""
    return AuthService.authenticate_user(db, login_data)

@router.get("/me", response_model=UserSummary)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the authenticated user profile with roles and assigned mine permissions."""
    roles = get_user_roles(current_user, db)
    assigned_mines = get_user_assigned_mine_ids(current_user, db)
    return UserSummary(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        designation=current_user.designation,
        department=current_user.department,
        roles=roles,
        assigned_mine_ids=assigned_mines
    )

@router.post("/register", response_model=UserDetail, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles([RoleEnum.SYSTEM_ADMIN])),
    db: Session = Depends(get_db)
):
    """Register a new user with roles and mine assignments (System Admin only)."""
    user = AuthService.create_user(db, user_in, creator_id=current_user.id)
    roles = get_user_roles(user, db)
    assigned_mines = get_user_assigned_mine_ids(user, db)
    return UserDetail(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        designation=user.designation,
        department=user.department,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        roles=roles,
        assigned_mine_ids=assigned_mines
    )
