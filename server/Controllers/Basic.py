from .login_controller import register_login_routes
from .admin_controller import register_admin_routes
from .user_controller import register_user_routes
from .quiz_controller import register_quiz_routes

def register_routes(api):
    register_login_routes(api)
    register_user_routes(api)
    register_admin_routes(api)
    register_quiz_routes(api)