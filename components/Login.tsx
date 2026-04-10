import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Shield, Smartphone, Mail, Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, verifyOTP, registerDevice, checkDevice, resendOTP } = useData();
  const [step, setStep] = useState<'login' | 'device' | 'otp' | 'success'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [deviceName, setDeviceName] = useState('My Device');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await resendOTP(email);
      setResendTimer(30);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceFingerprint = () => {
    // Simple fingerprint for demo purposes
    return navigator.userAgent + '-' + screen.width + 'x' + screen.height;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Check if device is registered
      const fingerprint = getDeviceFingerprint();
      const { isRegistered } = await checkDevice(fingerprint);

      if (!isRegistered) {
        setStep('device');
      } else {
        // Send OTP
        await login(email, password);
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const fingerprint = getDeviceFingerprint();
      await registerDevice(email, deviceName, fingerprint);
      // After device registration request, we still need OTP from admin
      await login(email, password, true); // true for isNewUser/NewDevice
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Device registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await verifyOTP(email, otp);
      setStep('success');
      // Success state will trigger App.tsx re-render via DataContext
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        {step === 'login' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h1>
            <p className="text-slate-400 text-center mb-8 text-sm">Enter your credentials to access the CRM</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 pl-12 pr-12 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'device' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-white text-center mb-2">New Device Detected</h1>
            <p className="text-slate-400 text-center mb-8 text-sm">Please register this device to continue</p>
            
            <form onSubmit={handleDeviceRegister} className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4 mb-6">
                <Smartphone className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-bold text-blue-400">Security Check</p>
                  <p className="text-xs text-blue-300/70 mt-1 leading-relaxed">
                    This device is not recognized. An OTP will be sent to the admin for approval after you provide a name for this device.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Device Name</label>
                <input 
                  type="text" 
                  required
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  placeholder="e.g. Office MacBook Pro"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register & Send OTP'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold text-white text-center mb-2">Verification Required</h1>
            <p className="text-slate-400 text-center mb-8 text-sm">An OTP has been sent to the admin</p>
            
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-white/5">
                  <Lock className="w-8 h-8 text-emerald-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center block">Enter 6-Digit Code</label>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-4 text-center text-3xl font-mono tracking-[0.5em] text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className={`text-emerald-500 font-bold hover:underline disabled:opacity-50 disabled:no-underline`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
                <span className="mx-2">|</span>
                <button type="button" onClick={() => setStep('login')} className="text-slate-400 hover:underline">Try again</button>
              </p>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="animate-in zoom-in duration-500 text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Granted</h1>
            <p className="text-slate-400 text-sm">Redirecting you to the dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};
