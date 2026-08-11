import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LocaleProvider } from './contexts/LocaleContext';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import UpgradePage from './pages/UpgradePage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import AdminAdsPage from './pages/AdminAdsPage';
import AdminSupportPage from './pages/AdminSupportPage';
import ChatWidget from './components/ChatWidget';
import { ExamsPage, PracticeSessionPage, EssayPage, LeaderboardPage } from './pages/PracticePages';
import { PrivacyPage, TermsPage, CookiesPage } from './pages/LegalPages';
import CookieConsent from './components/CookieConsent';


function App() {
    return (
        <Router>
            <AuthProvider>
                <LocaleProvider>
                    <ScrollToTop />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/exams" element={<ExamsPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/practice/:subjectId" element={<ProtectedRoute><PracticeSessionPage /></ProtectedRoute>} />
                        <Route path="/essay" element={<ProtectedRoute><EssayPage /></ProtectedRoute>} />
                        <Route path="/upgrade" element={<UpgradePage />} />
                        <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallbackPage /></ProtectedRoute>} />
                        <Route path="/admin/ads" element={<ProtectedRoute><AdminAdsPage /></ProtectedRoute>} />
                        <Route path="/admin/support" element={<ProtectedRoute><AdminSupportPage /></ProtectedRoute>} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/cookies" element={<CookiesPage />} />

                        <Route path="/login" element={<AuthPage mode="login" />} />
                        <Route path="/signup" element={<AuthPage mode="signup" />} />
                        <Route
                            path="/onboarding"
                            element={
                                <ProtectedRoute>
                                    <OnboardingPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                    <ChatWidget />
                    <CookieConsent />
                </LocaleProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
