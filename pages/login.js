// pages/login.js
// Why: Facebook-style login page using Pages Router (no App Router layout wrapping)

import Link from 'next/link';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Log in to Facebook | Facebook</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Log in to Facebook to start sharing and connecting with your friends, family, and people you know." />
        <meta property="og:title" content="Log in to Facebook | Facebook" />
        <meta property="og:description" content="Log in to Facebook to start sharing and connecting with your friends, family, and people you know." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.facebook.com/login" />
        <meta property="og:site_name" content="Facebook" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Log in to Facebook | Facebook" />
        <meta name="twitter:description" content="Log in to Facebook to start sharing and connecting with your friends, family, and people you know." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style jsx>{`
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: 'Hind Siliguri', system-ui, sans-serif;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[980px] w-full">
          {/* Top section - Facebook logo and tagline */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-12">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link 
                href="https://www.facebook.com" 
                className="mb-8"
                aria-label="Facebook home"
              >
                <span className="text-[60px] font-bold text-blue-600 tracking-tight select-none">
                  facebook
                </span>
              </Link>
              <p className="text-xl text-gray-600 font-normal leading-relaxed max-w-xs">
                Connect with friends and the world around you on Facebook.
              </p>
            </div>

            {/* Login Card */}
            <div className="w-full lg:w-[396px]">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                <form className="space-y-4" action="#" method="POST">
                  <div>
                    <label htmlFor="email" className="sr-only">Email or phone number</label>
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      placeholder="Email address or phone number"
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                      aria-label="Email or phone number"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="pass" className="sr-only">Password</label>
                    <div className="relative">
                      <input
                        id="pass"
                        name="pass"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors pr-12"
                        aria-label="Password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Log In
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <Link
                    href="/login/identify"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <hr className="my-4 border-gray-200" />

                <button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Create new account
                </button>
              </div>

              {/* Create a Page */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>
                  <Link
                    href="/pages/create"
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Create a Page
                  </Link>
                  {' '}
                  for a celebrity, brand or business.
                </p>
              </div>
            </div>
          </div>

          {/* Language links */}
          <div className="border-t border-gray-200 pt-6">
            <nav className="flex flex-wrap justify-center gap-2 lg:gap-3 text-sm text-gray-600" aria-label="Language selection">
              <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline" lang="en">
                English (UK)
              </Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">বাংলা</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">हिन्दी</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">اردو</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">العربية</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">Français (France)</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">Español</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">Português (Brasil)</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">Deutsch</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">Italiano</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">中文(简体)</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">日本語</Link>
              <Link href="#" className="hover:text-blue-700 hover:underline">한국어</Link>
              <span className="text-gray-400 mx-1">·</span>
              <Link href="#" className="hover:text-blue-700 hover:underline">+</Link>
            </nav>

            {/* Footer links */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 lg:gap-6 text-xs text-gray-500">
              <Link href="#" className="hover:text-gray-700 hover:underline">Sign Up</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Log In</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Messenger</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Facebook Lite</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Watch</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Marketplace</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Meta Pay</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Meta Store</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Games</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Meta Quest</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Instagram</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Threads</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Fundraisers</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Services</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Voting Information Center</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Groups</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">About</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Create ad</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Create Page</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Developers</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Careers</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Privacy</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Cookies</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Ad Choices</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Terms</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Help</Link>
              <Link href="#" className="hover:text-gray-700 hover:underline">Contact uploading and non-users</Link>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Meta © 2024
            </p>
          </div>
        </div>
      </div>
    </>
  );
}