import React from 'react'
import LoginForm from '../components/LoginForm'
import Link from 'next/link'

const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
        <LoginForm />
        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{' '}
          <Link href="/registeration" className="text-blue-600 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default page;
