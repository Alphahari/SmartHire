'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function RegisterationForm() {
    const router = useRouter();

    interface LoginFormData {
        full_name: string;
        email: string;
        password: string;
    }

    const [formData, setFormData] = useState<LoginFormData>({
        full_name: '',
        email: '',
        password: ''
    });


    const [message, setMessage] = useState('');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/register`, {
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
                    <label htmlFor="full_name" className="block text-sm font-medium">Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        id="full_name"
                        value={formData.full_name}
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

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Register Now
                </button>
            </form>

            {message && (
                <div className="mt-4 text-sm text-center text-red-500">{message}</div>
            )}
        </div>
    );
}