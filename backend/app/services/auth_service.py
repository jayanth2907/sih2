from typing import Optional, List
from sqlalchemy.orm import Session
from app.core.security import verify_password, hash_password, create_access_token
from app.core.config import settings
from app.core.exceptions import AuthenticationError, BusinessRuleViolationError
from app.core.authz import get_user_roles, get_user_assigned_mine_ids
from app.models.user import User, UserMineAssignment
from app.models.role import Role, UserRole
from app.schemas.auth import LoginRequest, TokenResponse, UserSummary, UserCreate
from app.services.audit_service import AuditService

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise AuthenticationError("Invalid email or password.")
        
        if not user.is_active:
            raise AuthenticationError("User account has been disabled.")
        
        roles = get_user_roles(user, db)
        assigned_mines = get_user_assigned_mine_ids(user, db)
        
        access_token = create_access_token(subject=user.id)
        
        # Audit login
        AuditService.log_event(
            db=db,
            actor_id=user.id,
            action="USER_LOGIN_SUCCESS",
            resource_type="USER",
            resource_id=str(user.id),
            metadata={"email": user.email, "roles": roles}
        )
        
        user_summary = UserSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            designation=user.designation,
            department=user.department,
            roles=roles,
            assigned_mine_ids=assigned_mines
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=user_summary
        )

    @staticmethod
    def create_user(db: Session, user_in: UserCreate, creator_id: Optional[int] = None) -> User:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise BusinessRuleViolationError(f"User with email {user_in.email} already exists.")
        
        user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hash_password(user_in.password),
            phone_number=user_in.phone_number,
            designation=user_in.designation,
            department=user_in.department,
            is_active=user_in.is_active,
            is_superuser=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Assign Roles
        for role_name in user_in.role_names:
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                db.add(UserRole(user_id=user.id, role_id=role.id))
        
        # Assign Mines
        for mine_id in user_in.assigned_mine_ids:
            db.add(UserMineAssignment(user_id=user.id, mine_id=mine_id))
        
        db.commit()
        
        # Audit user creation
        AuditService.log_event(
            db=db,
            actor_id=creator_id,
            action="USER_CREATED",
            resource_type="USER",
            resource_id=str(user.id),
            after_state={"email": user.email, "roles": user_in.role_names}
        )
        
        return user
