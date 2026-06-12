import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
    const {user} = useAuth();
  
    

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100 dark:bg-slate-950/80 dark:border-slate-800">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <Link to="/" onClick={() => scrollTo(0, 0)} className="flex items-center gap-2 ">
                    <img src="/logo.svg" alt="logo" className="size-7" />
                    <span className="text-xl lg:text-2xl font-medium font-serif text-slate-800 dark:text-slate-100">Scheduler</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
                    <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100">
                        Features
                    </a>
                    <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-slate-100">
                        How it works
                    </a>
                    <a href="#pricing" className="hover:text-slate-900 dark:hover:text-slate-100">
                        Pricing
                    </a>
                </div>

                {user ? (
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-sm hover:shadow-red-200 hover:shadow-md dark:hover:shadow-red-950">
                            Go to Dashboard <ArrowRightIcon className="size-3.5" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block dark:text-slate-300 dark:hover:text-white">
                            Sign In
                        </Link>
                        <Link to="/login" className="flex items-center gap-1.5 text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-sm hover:shadow-red-200 hover:shadow-md dark:hover:shadow-red-950">
                            Get Started <ArrowRightIcon className="size-3.5" />
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
