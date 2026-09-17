from fastapi import HTTPException, status

class EntityNotFoundError(HTTPException):
    def __init__(self, entity_name: str, entity_id: any):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_name} with ID '{entity_id}' was not found."
        )

class PermissionDeniedError(HTTPException):
    def __init__(self, detail: str = "You do not have permission to perform this action or access this mine resource."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Invalid credentials or expired authentication session."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class BusinessRuleViolationError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )
