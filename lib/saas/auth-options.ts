import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { upsertOAuthUser } from './auth-store';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'common',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'drishti_nextauth_default_jwt_secret_key_32chars!',
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      try {
        const providerName = (account?.provider === 'azure-ad' ? 'microsoft' : account?.provider || 'google') as 'google' | 'apple' | 'microsoft';
        const dbUser = await upsertOAuthUser({
          provider: providerName === 'apple' ? 'google' : providerName,
          providerAccountId: account?.providerAccountId || user.id || `soc-${Date.now()}`,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          picture: user.image || undefined,
        });
        
        (user as any).tenantId = dbUser.tenant_id;
        (user as any).role = dbUser.role || 'admin';
        (user as any).shopName = dbUser.shopName;
        (user as any).mobile = dbUser.mobile;
        return true;
      } catch (error) {
        console.error('Error during NextAuth signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role || 'admin';
        token.shopName = (user as any).shopName;
        token.mobile = (user as any).mobile;
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).role = token.role || 'admin';
        (session.user as any).shopName = token.shopName;
        (session.user as any).mobile = token.mobile;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};
