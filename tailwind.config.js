/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Custom colors from globals.css
                "bg-primary": "var(--bg-primary)",
                "bg-secondary": "var(--bg-secondary)",
                "text-primary": "var(--text-primary)",
                "text-secondary": "var(--text-secondary)",
                "accent-primary": "var(--accent-primary)",
                "accent-hover": "var(--accent-hover)",
                "border-subtle": "var(--border-subtle)",
            },
        },
    },
    plugins: [],
};
