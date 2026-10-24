import { Hono } from 'hono';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../db/client';
import { users, accounts, sessions } from '../db/schema';
import type { Env } from './public';

export const authRoutes = new Hono<{ Bindings: Env; Variables: { ownerId: string } }>();

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + ':reviewboost_auth_salt_2026');
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Signup: Register new store owner
authRoutes.post('/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return c.json({ error: 'Please enter your full name or business name.' }, 400);
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return c.json({ error: 'Please enter a valid email address.' }, 400);
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters long.' }, 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const db = getDb(c.env.DB);

    // Check if user already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return c.json({ error: 'An account with this email already exists. Please log in.' }, 400);
    }

    const now = new Date();
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const hashedPassword = await hashPassword(password);

    // 1. Create User
    await db.insert(users).values({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      emailVerified: true,
      createdAt: now,
      updatedAt: now
    });

    // 2. Create Credential Account
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await db.insert(accounts).values({
      id: accountId,
      userId: userId,
      accountId: cleanEmail,
      providerId: 'credentials',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    });

    // 3. Create Session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
      id: sessionId,
      userId: userId,
      token: token,
      expiresAt: expiresAt,
      createdAt: now,
      updatedAt: now
    });

    return c.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: 'owner'
      }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return c.json({ error: err?.message || 'Failed to create account. Please try again.' }, 500);
  }
});

// Login: Authenticate existing store owner
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required.' }, 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const db = getDb(c.env.DB);

    // Find user
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      return c.json({ error: 'No account found with this email. Please sign up first.' }, 401);
    }

    // Find account credentials
    const [account] = await db
      .select({
        id: accounts.id,
        password: accounts.password
      })
      .from(accounts)
      .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, 'credentials')))
      .limit(1);

    const hashedInput = await hashPassword(password);

    if (account && account.password) {
      if (account.password !== hashedInput) {
        return c.json({ error: 'Incorrect password. Please try again.' }, 401);
      }
    } else {
      // If user exists without password account (e.g. created previously), link credentials now
      const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();
      await db.insert(accounts).values({
        id: accountId,
        userId: user.id,
        accountId: cleanEmail,
        providerId: 'credentials',
        password: hashedInput,
        createdAt: now,
        updatedAt: now
      });
    }

    // Issue new session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`;
    const now = new Date();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      token: token,
      expiresAt: expiresAt,
      createdAt: now,
      updatedAt: now
    });

    return c.json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'owner'
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return c.json({ error: err?.message || 'Login failed. Please try again.' }, 500);
  }
});

// Current User profile & session validation
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Not authenticated', user: null }, 401);
  }

  try {
    const db = getDb(c.env.DB);
    const now = new Date();

    const [session] = await db
      .select({
        userId: sessions.userId,
        userName: users.name,
        userEmail: users.email
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (!session) {
      return c.json({ error: 'Session expired or invalid', user: null }, 401);
    }

    return c.json({
      user: {
        id: session.userId,
        name: session.userName,
        email: session.userEmail,
        role: 'owner'
      }
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to verify session', user: null }, 500);
  }
});

// Logout: Revoke session
authRoutes.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token) {
    try {
      const db = getDb(c.env.DB);
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch {}
  }

  return c.json({ success: true, message: 'Logged out successfully' });
});
