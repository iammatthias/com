import { NextURL } from 'next/dist/server/web/next-url'
import { NextResponse } from 'next/server'

export function middleware(NextRequest) {
  const req = NextRequest
  const basicAuth = req.headers.get('authorization')
  const path = req.url

  if (path == '/dev/') {
    if (basicAuth) {
      const auth = basicAuth.split(' ')[1]
      const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':')

      if (
        user === process.env.NEXT_PUBLIC_USER &&
        pwd === process.env.NEXT_PUBLIC_PASSWORD
      ) {
        return NextResponse.next()
      }
    }

    return new Response('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  } else {
    return NextResponse.next()
  }
}
