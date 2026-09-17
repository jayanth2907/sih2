from typing import List, Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.permissions import RoleEnum
from app.models.user import User, UserMineAssignment
from app.models.role import UserRole, Role

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Authorization header missing or malformed.")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise AuthenticationError("Invalid or expired authentication token.")
    
    user_id = payload["sub"]
    try:
        user_id_int = int(user_id)
    except ValueError:
        raise AuthenticationError("Malformed token subject.")
    
    user = db.query(User).filter(User.id == user_id_int).first()
    if not user:
        raise AuthenticationError("User not found.")
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise AuthenticationError("User account is deactivated.")
    return current_user

def get_user_roles(user: User, db: Session) -> List[str]:
    user_roles = (
        db.query(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == user.id)
        .all()
    )
    roles = [r[0] for r in user_roles]
    if user.is_superuser and RoleEnum.SYSTEM_ADMIN.value not in roles:
        roles.append(RoleEnum.SYSTEM_ADMIN.value)
    return roles

def get_user_assigned_mine_ids(user: User, db: Session) -> List[int]:
    assignments = (
        db.query(UserMineAssignment.mine_id)
        .filter(UserMineAssignment.user_id == user.id)
        .all()
    )
    return [a[0] for a in assignments]

def check_mine_access(user: User, mine_id: int, db: Session) -> bool:
    roles = get_user_roles(user, db)
    # SYSTEM_ADMIN and REGULATOR have cross-mine visibility
    if RoleEnum.SYSTEM_ADMIN.value in roles or RoleEnum.REGULATOR.value in roles or user.is_superuser:
        return True
    
    assigned_mine_ids = get_user_assigned_mine_ids(user, db)
    return mine_id in assigned_mine_ids

def require_roles(allowed_roles: List[RoleEnum]):
    def role_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        user_roles = get_user_roles(current_user, db)
        allowed_str = [r.value for r in allowed_roles]
        
        # Superuser always bypasses
        if current_user.is_superuser or RoleEnum.SYSTEM_ADMIN.value in user_roles:
            return current_user
        
        has_role = any(role in allowed_str for role in user_roles)
        if not has_role:
            raise PermissionDeniedError(
                f"Access denied. Requires one of roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

def require_mine_access(mine_id: int, current_user: User, db: Session) -> None:
    if not check_mine_access(current_user, mine_id, db):
        raise PermissionDeniedError(
            f"Access denied. User {current_user.email} is not authorized for Mine ID {mine_id}."
        )
