from flask import request, jsonify
from flask_jwt_extended import create_access_token
from flask_restful import Resource
import bcrypt
from models import db, User
from datetime import datetime

def register_login_routes(api):
        
    class Login(Resource):
        def options(self): 
            return {'Allow': 'POST'}, 200, \
                {'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Credentials': 'true'}
        def post(self):
            data = request.get_json()
            email = data.get('email').strip()
            password = data.get('password').strip()
            
            user = User.query.filter_by(email=email).first()
            if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
                return {'error': 'Invalid credentials'}, 401
            access_token = create_access_token(identity=str(user.id))
            print(access_token)
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

    api.add_resource(Login, '/auth/login')
    api.add_resource(Register, '/auth/register')
