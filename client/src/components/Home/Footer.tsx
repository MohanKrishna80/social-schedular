import { Link } from "react-router-dom";

const footerLinks = {
    Product: ["Features", "How it works", "Pricing", "Changelog"],
    Company: ["About", "Blog", "Careers", "Press"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

export default function Footer() {
    return (
        <footer className="bg-[#fafafa] border-t border-black/10 dark:bg-slate-900 dark:border-slate-800">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" onClick={() => scrollTo(0, 0)} className="inline-flex items-center gap-2 mb-5">
                            <img src="/logo.svg" alt="logo" className="size-6" />
                            <span className="font-medium font-serif text-xl text-gray-800 dark:text-slate-100">Scheduler</span>
                        </Link>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs dark:text-slate-400">The AI-powered social media scheduler that helps creators and teams grow faster with less effort.</p>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <div className="text-xs font-semibold uppercase tracking-widest mb-5 text-gray-600 dark:text-slate-300">{category}</div>
                            <ul className="space-y-1">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-black/10 dark:border-slate-800">
                    <p className="text-xs text-gray-400 dark:text-slate-500">© {new Date().getFullYear()} Scheduler. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-xs text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300">
                            Terms of Service
                        </a>
                        <Link to="/login" className="text-xs text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
