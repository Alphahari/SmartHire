'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Id, toast, ToastContainer } from 'react-toastify';

type LoginFormData = {
    email: string;
    password: string;
};

export default function LoginForm() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        const toastId: Id = toast.loading('Logging in...');
        try {
            const res = await fetch(`${process.env.BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            if (res.ok) {
                toast.update(toastId, {
                    render: 'Login Successful!',
                    type: 'success',
                    isLoading: false,
                    autoClose: 3000,
                    closeOnClick: true,
                });
                router.push('/dashboard');
            } else {
                toast.update(toastId, {
                    render: 'Login Failed',
                    type: 'warning',
                    isLoading: false,
                    autoClose: 3000,
                    closeOnClick: true,
                });
            }
        } catch (error) {
                toast.update(toastId, {
                    render: 'Error connecting to server',
                    type: 'error',
                    isLoading: false,
                    autoClose: 3000,
                    closeOnClick: true,
                });
        } finally {
            toast.loading("");
        }
    };
    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        {...register('email', { required: 'Email is required' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        id="password"
                        {...register('password', { required: 'Password is required' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200"
                >
                    Sign In
                </button>
            </form>
        </>
    );
}