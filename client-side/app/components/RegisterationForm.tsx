'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function RegisterationForm() {
    const router = useRouter();

    interface LoginFormData {
        username: string;
        email: string;
        password: string;
        qualification?: string;
        dob?: string;
    }

    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        email: '',
        password: '',
        qualification: '',
        dob: '',
    });


    const [message, setMessage] = useState('');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage('Login successful');
                router.push('/dashboard');
            } else {
                setMessage(data.message || 'Login failed');
            }
        } catch (error) {
            setMessage('Error connecting to server');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow bg-white">
            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label htmlFor="username" className="block text-sm font-medium">Username</label>
                    <input
                        type="text"
                        name="username"
                        id="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium">Password</label>
                    <input
                        type="password"
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <div>
                    <label htmlFor="qualification" className="block text-sm font-medium">Qualification</label>
                    <input
                        type="text"
                        name="qualification"
                        id="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <div>
                    <label htmlFor="dob" className="block text-sm font-medium">Date of Birth</label>
                    <input
                        type="date"
                        name="dob"
                        id="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border rounded-md"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Login
                </button>
            </form>

            {message && (
                <div className="mt-4 text-sm text-center text-red-500">{message}</div>
            )}
        </div>
    );
}
