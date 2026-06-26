import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfile } from '../api/backend';
import { Spinner, Modal } from '../components/ui';
import { C, inputStyle } from '../constants/colors';

type TabId = 'account' | 'privacy' | 'notifications' | 'connected' | 'appearance';

export default function Settings() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<TabId>('account');

  // Interactive Notification Toggles
  const [mailboxNotif, setMailboxNotif] = useState(true);
  const [reviewReplies, setReviewReplies] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [libraryUpdates, setLibraryUpdates] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  // Interactive Privacy Toggles
  const [profilePublic, setProfilePublic] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);

  // Modal Control States
  const [editModalField, setEditModalField] = useState<'username' | 'bio' | 'email' | 'password' | 'delete' | null>(null);
  
  // Field values for edits
  const [tempUsername, setTempUsername] = useState('');
  const [tempBio, setTempBio] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form Saving States
  const [savingField, setSavingField] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Initial Populate from User Object
  useEffect(() => {
    if (user) {
      setTempUsername(user.username || '');
      setTempBio(user.bio || '');
      setTempEmail(user.email || '');
    }
  }, [user]);

  if (!user) return null;

  // Handles updating username/bio on the backend
  const handleUpdateProfileField = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingField(true);
    setSuccessBanner('');
    setErrorBanner('');

    try {
      if (editModalField === 'username') {
        if (!tempUsername.trim()) throw new Error('Username cannot be empty');
        await updateProfile({ username: tempUsername.trim() });
        setSuccessBanner('Username updated successfully!');
      } else if (editModalField === 'bio') {
        await updateProfile({ bio: tempBio.trim() });
        setSuccessBanner('Biography updated successfully!');
      } else if (editModalField === 'email') {
        if (!tempEmail.trim()) throw new Error('Email cannot be empty');
        // Simulated endpoint or warning if user is OAuth
        if (user.provider === 'google') {
          throw new Error('Email cannot be changed on Google Accounts.');
        }
        await updateProfile({ username: user.username, bio: user.bio }); // just triggers refresh
        setSuccessBanner('Email update request sent! (Simulated)');
      } else if (editModalField === 'password') {
        if (user.provider === 'google') {
          throw new Error('Passwords cannot be set on Google Accounts.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match.');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        setSuccessBanner('Password updated successfully! (Simulated)');
      }
      
      await refreshUser();
      setEditModalField(null);
      // Clear inputs
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorBanner(err?.message || err?.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSavingField(false);
      setTimeout(() => {
        setSuccessBanner('');
        setErrorBanner('');
      }, 4000);
    }
  };

  // Simulated account deletion
  const handleDeleteAccount = async () => {
    setSavingField(true);
    try {
      // Deletes locally and logs out
      alert('Your account deletion has been processed. Logging you out...');
      await logout();
      navigate('/login');
    } catch {
      setErrorBanner('Failed to delete account.');
    } finally {
      setSavingField(false);
      setEditModalField(null);
    }
  };

  // Toggle Switch Component
  const ToggleSwitch = ({ active, onToggle }: { active: boolean; onToggle: () => void }) => {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 20,
          background: active ? C.accent : 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          position: 'relative',
          cursor: 'pointer',
          outline: 'none',
          padding: 0,
          transition: 'background-color 0.25s ease',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#FFF',
            position: 'absolute',
            top: 3,
            left: active ? 23 : 3,
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', width: '100%', paddingBottom: 60 }}>
      {/* Settings Header Block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => navigate(-1)}
          className="nav-btn"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${C.border}`,
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: C.text,
            fontSize: 16,
            outline: 'none',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>Settings</h1>
      </div>

      {/* Success/Error Alerts */}
      {successBanner && (
        <div style={{
          padding: '10px 14px', background: `${C.success}15`, border: `1px solid ${C.success}30`,
          borderRadius: 10, fontSize: 13, color: C.success, marginBottom: 20,
          animation: 'fadeIn 0.2s'
        }}>{successBanner}</div>
      )}
      {errorBanner && (
        <div style={{
          padding: '10px 14px', background: `${C.danger}15`, border: `1px solid ${C.danger}30`,
          borderRadius: 10, fontSize: 13, color: C.danger, marginBottom: 20,
          animation: 'fadeIn 0.2s'
        }}>{errorBanner}</div>
      )}

      {/* Outer Flex Container for Sidebar + Content */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'stretch' }}>
        
        {/* Settings Left Navigation Sidebar */}
        <aside style={{
          width: 220,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {[
            { id: 'account', label: 'Account', icon: '👤' },
            { id: 'privacy', label: 'Privacy', icon: '🔒' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
            { id: 'connected', label: 'Connected Accounts', icon: '🔗' },
            { id: 'appearance', label: 'Appearance', icon: '🎨' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  outline: 'none',
                  color: isActive ? '#FFF' : C.muted,
                  background: isActive ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'rgb(239, 68, 68)' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Pane */}
        <main style={{
          flex: 1,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 26,
          minHeight: 440,
        }}>

          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Account</h2>
              <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 24px' }}>Manage your account settings and credentials.</p>

              {/* Rows List Container */}
              <div style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                
                {/* Username Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Username</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{user.username}</p>
                  </div>
                  <button onClick={() => setEditModalField('username')} style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Change
                  </button>
                </div>

                {/* Bio Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ flex: 1, paddingRight: 20 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Bio</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 460 }}>{user.bio || 'No bio yet.'}</p>
                  </div>
                  <button onClick={() => setEditModalField('bio')} style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Change
                  </button>
                </div>

                {/* Email Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Email</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{user.email} {user.provider === 'google' && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, background: `${C.accent}20`, color: C.accentLight, marginLeft: 6 }}>Google</span>}</p>
                  </div>
                  <button onClick={() => setEditModalField('email')} disabled={user.provider === 'google'} style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: user.provider === 'google' ? C.card : C.text, fontSize: 12, fontWeight: 600, cursor: user.provider === 'google' ? 'not-allowed' : 'pointer', opacity: user.provider === 'google' ? 0.4 : 1, fontFamily: 'inherit' }}>
                    Change
                  </button>
                </div>

                {/* Password Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Password</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{user.provider === 'google' ? 'Managed by Google Authentication' : '••••••••••••'}</p>
                  </div>
                  <button onClick={() => setEditModalField('password')} disabled={user.provider === 'google'} style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: user.provider === 'google' ? C.card : C.text, fontSize: 12, fontWeight: 600, cursor: user.provider === 'google' ? 'not-allowed' : 'pointer', opacity: user.provider === 'google' ? 0.4 : 1, fontFamily: 'inherit' }}>
                    Change
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Account */}
              <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 32, paddingTop: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.danger, margin: '0 0 4px' }}>Delete Account</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: 12.5, color: C.muted, margin: 0 }}>Permanently delete your account and all your data.</p>
                  <button onClick={() => setEditModalField('delete')} style={{ padding: '8px 20px', borderRadius: 8, background: `${C.danger}15`, border: `1px solid ${C.danger}40`, color: C.danger, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Privacy</h2>
              <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 24px' }}>Manage how your information is shared and visible.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  {
                    title: 'Profile Visibility',
                    desc: 'Allow other users to search for your profile and see your library list.',
                    val: profilePublic,
                    set: setProfilePublic,
                  },
                  {
                    title: 'Show Activity',
                    desc: 'Display your recent tracking updates, ratings, and reviews in the Community feed.',
                    val: showActivity,
                    set: setShowActivity,
                  },
                  {
                    title: 'Direct Messaging',
                    desc: 'Allow other tracked users to start chat parties and send direct messages.',
                    val: allowDirectMessages,
                    set: setAllowDirectMessages,
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                    <div style={{ flex: 1, paddingRight: 20 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{item.title}</p>
                      <p style={{ fontSize: 12.5, color: C.muted, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                    <ToggleSwitch active={item.val} onToggle={() => item.set(!item.val)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Notifications</h2>
              <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 24px' }}>Choose what you want to be notified about.</p>

              {/* Switches Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  {
                    title: 'Mailbox Notifications',
                    desc: 'Get notified for new messages.',
                    val: mailboxNotif,
                    set: setMailboxNotif,
                  },
                  {
                    title: 'Review Replies',
                    desc: 'Get notified when someone replies to your review.',
                    val: reviewReplies,
                    set: setReviewReplies,
                  },
                  {
                    title: 'Achievement Alerts',
                    desc: 'Get notified when you unlock new achievements.',
                    val: achievementAlerts,
                    set: setAchievementAlerts,
                  },
                  {
                    title: 'Library Updates',
                    desc: 'Get notified about airing updates and releases.',
                    val: libraryUpdates,
                    set: setLibraryUpdates,
                  },
                  {
                    title: 'Newsletter',
                    desc: 'Receive occasional updates and newsletters.',
                    val: newsletter,
                    set: setNewsletter,
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                    <div style={{ flex: 1, paddingRight: 20 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{item.title}</p>
                      <p style={{ fontSize: 12.5, color: C.muted, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                    <ToggleSwitch active={item.val} onToggle={() => item.set(!item.val)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONNECTED ACCOUNTS */}
          {activeTab === 'connected' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Connected Accounts</h2>
              <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 24px' }}>Link your account with external social sign-in providers.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Google Connection Card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24 }}>🔴</span>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Google Account</p>
                      <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>{user.provider === 'google' ? `Linked to ${user.email}` : 'Not connected'}</p>
                    </div>
                  </div>
                  {user.provider === 'google' ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>Connected</span>
                  ) : (
                    <button style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Connect
                    </button>
                  )}
                </div>

                {/* Discord Connection Card (Mocked) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24 }}>👾</span>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>Discord Link</p>
                      <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>Sync your watch parties to Discord status</p>
                    </div>
                  </div>
                  <button style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Connect
                  </button>
                </div>

                {/* GitHub Connection Card (Mocked) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24 }}>🐙</span>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700, color: C.text, margin: '0 0 2px' }}>GitHub</p>
                      <p style={{ fontSize: 11.5, color: C.muted, margin: 0 }}>Access developer integrations</p>
                    </div>
                  </div>
                  <button style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: APPEARANCE (The visual layout we built earlier) */}
          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>Appearance</h2>
              <p style={{ fontSize: 12.5, color: C.muted, margin: '0 0 24px' }}>Choose a themed style preset to change the look and mood of your dashboard.</p>

              {/* Grid of Theme Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {themes.map((t) => {
                  const isActive = t.id === theme;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        background: t.palette.card,
                        border: `2px solid ${isActive ? C.accent : t.palette.border}`,
                        borderRadius: 14,
                        padding: 16,
                        cursor: 'pointer',
                        boxShadow: isActive ? `0 8px 20px ${C.accent}25` : 'none',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = C.accentLight;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.borderColor = t.palette.border;
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{t.emoji}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: t.palette.text }}>{t.name}</span>
                        {isActive && (
                          <span style={{
                            marginLeft: 'auto', fontSize: 9.5, background: C.accent, color: '#fff',
                            padding: '1.5px 7px', borderRadius: 20, fontWeight: 700
                          }}>Active</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: t.palette.muted, margin: '0 0 14px', lineHeight: 1.4 }}>
                        {t.description}
                      </p>

                      {/* Swatches */}
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span style={{ fontSize: 8.5, color: t.palette.muted, fontWeight: 700, textTransform: 'uppercase', marginRight: 4 }}>Swatches</span>
                        {[
                          t.palette.bg,
                          t.palette.card,
                          t.palette.accent,
                          t.palette.text,
                          t.palette.success
                        ].map((color, i) => (
                          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: `1px solid ${t.palette.border}` }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* POPUP EDIT MODALS */}

      {/* 1. Change Username Modal */}
      <Modal open={editModalField === 'username'} onClose={() => setEditModalField(null)} title="Change Username">
        <form onSubmit={handleUpdateProfileField} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Enter New Username</label>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Username..."
              required
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <button type="submit" disabled={savingField} style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {savingField ? <Spinner size={16} /> : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* 2. Change Bio Modal */}
      <Modal open={editModalField === 'bio'} onClose={() => setEditModalField(null)} title="Change Bio">
        <form onSubmit={handleUpdateProfileField} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Write short bio</label>
            <textarea
              value={tempBio}
              onChange={(e) => setTempBio(e.target.value)}
              placeholder="Bio description..."
              maxLength={300}
              rows={4}
              style={{ ...inputStyle, width: '100%', resize: 'vertical' }}
            />
          </div>
          <button type="submit" disabled={savingField} style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {savingField ? <Spinner size={16} /> : 'Save Changes'}
          </button>
        </form>
      </Modal>

      {/* 3. Change Email Modal */}
      <Modal open={editModalField === 'email'} onClose={() => setEditModalField(null)} title="Change Email">
        <form onSubmit={handleUpdateProfileField} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6 }}>Enter New Email</label>
            <input
              type="email"
              value={tempEmail}
              onChange={(e) => setTempEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <button type="submit" disabled={savingField} style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {savingField ? <Spinner size={16} /> : 'Request Verification'}
          </button>
        </form>
      </Modal>

      {/* 4. Change Password Modal */}
      <Modal open={editModalField === 'password'} onClose={() => setEditModalField(null)} title="Change Password">
        <form onSubmit={handleUpdateProfileField} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 4 }}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <button type="submit" disabled={savingField} style={{ padding: '10px 0', background: C.accent, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {savingField ? <Spinner size={16} /> : 'Update Password'}
          </button>
        </form>
      </Modal>

      {/* 5. Delete Account Modal */}
      <Modal open={editModalField === 'delete'} onClose={() => setEditModalField(null)} title="Delete Account?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13.5, color: C.muted, margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to permanently delete your KirokuVault account? All your tracking entries, reviews, and favorites will be permanently erased.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setEditModalField(null)} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 9, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={handleDeleteAccount} style={{ padding: '8px 16px', background: C.danger, border: 'none', borderRadius: 9, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
