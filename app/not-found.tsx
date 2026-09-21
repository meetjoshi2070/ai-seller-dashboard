import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 py-24 sm:py-32 lg:px-8">
      {/* Background Decorative Glow */}
      <div 
        className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl" 
        aria-hidden="true"
      >
        <div 
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Content Section */}
      <div className="text-center">
        <p className="text-base font-semibold text-indigo-400">Error 404</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Page not found
        </h1>
        <p className="mt-6 text-lg leading-7 text-slate-400 max-w-md mx-auto">
          Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or never existed.
        </p>
        
        {/* Navigation Actions */}
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/"
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
          >
            Go back home
          </Link>
          {/* <Link 
            href="/support" 
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Contact support <span aria-hidden="true">&rarr;</span>
          </Link> */}
        </div>
      </div>
    </main>
  );
}