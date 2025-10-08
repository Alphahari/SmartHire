from flask import request, jsonify
from flask_jwt_extended import create_access_token
from flask_restful import Resource
import bcrypt
from models import db, User
from datetime import datetime

def register_login_routes(api):
        
    class Login(Resource):
        def post(self):
            data = request.get_json()
            email = data.get('email').strip()
            password = data.get('password').strip()
            
            user = User.query.filter_by(email=email).first()
            if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                return {'error': 'Invalid credentials'}, 401
            access_token = create_access_token(identity=str(user.id))
            response = jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'role': user.role.value,
                    'email': user.email,
                    'name': user.full_name,
                    'access_token':access_token
                }
            })
            user.last_visited = datetime.utcnow()
            db.session.commit()
            return response
        

    class Register(Resource):
        def post(self):
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            full_name = data.get('full_name')
            if User.query.filter_by(email=email).first():
                return {'error': 'Email already registered'}, 400
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            new_user = User(
                email=email,
                password=hashed_password,
                full_name=full_name,
            )
            db.session.add(new_user)
            db.session.commit()

            return {'message': 'Registration successful'}, 201
        
    class OAuthLogin(Resource):
        def post(self):
            data = request.json
            email = data.get('email')
            name = data.get('name')
            provider = data.get('provider')
            provider_id = data.get('providerAccountId')

            if not email:
                return {"error": "Email is required"}, 400

            user = User.query.filter_by(email=email).first()

            if not user:
                user = User(
                    email=email,
                    full_name=name or email.split('@')[0],
                    password="oauth_login",
                    provider=provider,
                    provider_id=provider_id
                )
                db.session.add(user)
                db.session.commit()
            else:
                if not user.provider:
                    user.provider = provider
                    user.provider_id = provider_id
                    db.session.commit()

            access_token = create_access_token(identity=str(user.id))

            return {
                'message': 'Login successful',
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.full_name,
                    "role": user.role.value,
                    "access_token": access_token
                }
            }, 200

    api.add_resource(Login, '/auth/login')
    api.add_resource(Register, '/auth/register')
    api.add_resource(OAuthLogin, '/auth/oauth-login')