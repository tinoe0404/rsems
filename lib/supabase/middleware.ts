import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/signup', '/admin/login', '/terms', '/privacy', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Skip API routes and static files early
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
        return supabaseResponse;
    }

    // Check if this is an admin route
    const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
    const isPatientRoute = pathname.startsWith('/dashboard') || pathname === '/onboarding';

    // If user is not authenticated
    if (!user) {
        // Allow access to public routes
        if (isPublicRoute) {
            return supabaseResponse;
        }

        // Redirect to appropriate login page
        const url = request.nextUrl.clone();
        if (isAdminRoute) {
            url.pathname = '/admin/login';
        } else {
            url.pathname = '/login';
        }
        return NextResponse.redirect(url);
    }

    // User is authenticated - only fetch role if accessing protected routes
    if (isAdminRoute || isPatientRoute || pathname === '/login' || pathname === '/signup' || pathname === '/admin/login') {
        let userRole = 'patient'; // default
        try {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileData) {
                userRole = profileData.role;
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            // Continue with default role
        }

        // Role-based route protection
        if (isAdminRoute && userRole !== 'clinician') {
            // Patient trying to access admin routes - redirect to patient dashboard
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }

        if (isPatientRoute && userRole === 'clinician') {
            // Clinician trying to access patient routes - redirect to admin dashboard
            const url = request.nextUrl.clone();
            url.pathname = '/admin/dashboard';
            return NextResponse.redirect(url);
        }

        // Handle authenticated users on login/signup pages
        if (pathname === '/login' || pathname === '/signup') {
            const url = request.nextUrl.clone();
            // Redirect based on role
            if (userRole === 'clinician') {
                url.pathname = '/admin/dashboard';
            } else {
                url.pathname = '/dashboard';
            }
            return NextResponse.redirect(url);
        }

        // Handle authenticated users on admin login page
        if (pathname === '/admin/login') {
            const url = request.nextUrl.clone();
            if (userRole === 'clinician') {
                url.pathname = '/admin/dashboard';
            } else {
                // Patient on admin login - redirect to patient dashboard
                url.pathname = '/dashboard';
            }
            return NextResponse.redirect(url);
        }
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely.

    return supabaseResponse;
}
