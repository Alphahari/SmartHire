from flask import request, jsonify
from flask_restful import Resource
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, get_jwt_identity,
    set_access_cookies, set_refresh_cookies, unset_jwt_cookies
)
import bcrypt
from models import db, User
from datetime import datetime

def register_login_routes(api):
    class TokenRefresh(Resource):
        @jwt_required(refresh=True)
        def post(self):
            current_user = get_jwt_identity()
            new_access_token = create_access_token(identity=current_user)
            response = jsonify({'message': 'Token refreshed'})
            set_access_cookies(response, new_access_token)
            return response
        
    class Login(Resource):
        def post(self):
            data = request.get_json()
            email = data.get('email').strip()
            password = data.get('password').strip()
            
            user = User.query.filter_by(email=email).first()
            if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                return {'error': 'Invalid credentials'}, 401
            
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
            response = jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'role': user.role.value,
                    'email': user.email,
                    'name': user.full_name
                }
            })
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)
            user.last_visited = datetime.utcnow()
            db.session.commit()
            return response
        

    class Register(Resource):
        def post(self):
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            full_name = data.get('full_name')
            username = data.get('username')
            dob = data.get('dob')
            if dob:
                dob = datetime.strptime(dob, '%Y-%m-%d').date()
            qualification = data.get('qualification')

            if User.query.filter_by(email=email).first():
                return {'error': 'Email already registered'}, 400

            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            new_user = User(
                username=username,
                email=email,
                password=hashed_password,
                full_name=full_name,
                dob=dob,
                qualification=qualification
            )
            db.session.add(new_user)
            db.session.commit()

            return {'message': 'Registration successful'}, 201
        
    class Logout(Resource):
        @jwt_required()
        def post(self):
            response = jsonify({'message': 'Logout successful'})
            unset_jwt_cookies(response)
            return response
        
    class CurrentUser(Resource):
        @jwt_required()
        def get(self):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user:
                return {'error': 'User not found'}, 404

            return {
                'id': user.id,
                'email': user.email,
                'role': user.role.value,
                'name': user.full_name
            }

    api.add_resource(CurrentUser, '/auth/me')
    api.add_resource(TokenRefresh, '/auth/refresh')
    api.add_resource(Logout, '/auth/logout')
    api.add_resource(Login, '/auth/login')
    api.add_resource(Register, '/auth/register')
