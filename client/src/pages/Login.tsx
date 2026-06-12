import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  User2Icon,
  LoaderCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const [loginState, setLoginState] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login, user } = useAuth();
  console.log("Navbar user:", user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post(
        `/api/auth/${loginState ? "login" : "register"}`,
        {
          email,
          password,
          name,
        },
      );

      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
      };

      login(userData, data.token);

      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm p-8 dark:bg-slate-900 dark:border dark:border-slate-800">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="size-6.5" />
              <h1 className="text-2xl">Scheduler</h1>
            </Link>
            <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">
              Sign in to your Dashboard
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            {!loginState && (
              <div>
                <label className="block mb-1.5">Name</label>
                <div className="relative">
                  <User2Icon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:outline-slate-600"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block mb-1.5">Email</label>
              <div className="relative">
                <MailIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:outline-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5">Password</label>
              <div className="relative">
                <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500 dark:outline-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-linear-to-r from-red-600 to-red-500 text-white rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  {loginState ? "Signing in..." : "Signing up..."}
                </>
              ) : (
                <>
                  {loginState ? "Sign In" : "Sign Up"}{" "}
                  <ArrowRightIcon className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {loginState ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setLoginState(false)}
                  className="text-red-600 hover:text-red-700"
                >
                  Create one free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setLoginState(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
