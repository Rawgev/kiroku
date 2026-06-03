import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User';

// ── Local (email + password) ───────────────────────────────
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return done(null, false, { message: 'No account found with that email.' });
      if (!user.password) return done(null, false, { message: 'This account uses social login. Please sign in with Google.' });
      const match = await user.comparePassword(password);
      if (!match) return done(null, false, { message: 'Incorrect password.' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

// ── Google OAuth ───────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:  '/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // 1. Existing user with Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. Existing user with same email → link account
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) user.avatar = profile.photos[0].value;
            await user.save();
            return done(null, user);
          }
        }

        // 3. New user
        const baseUsername = (profile.displayName || 'user')
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 18);
        const username = `${baseUsername}_${Date.now().toString().slice(-4)}`;

        user = await User.create({
          username,
          email:    email || `google_${profile.id}@placeholder.com`,
          googleId: profile.id,
          avatar:   profile.photos?.[0]?.value || '',
          provider: 'google',
        });
        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

// Serialize/deserialize (minimal — only used during OAuth dance)
passport.serializeUser((user: any, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
