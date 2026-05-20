
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Plus, Search, User as UserIcon, Home as HomeIcon, LayoutGrid, 
  LogOut, PlusCircle, Briefcase, Shuffle, Edit3, ArrowRight, Heart, Upload, Image as ImageIcon, AlertCircle, Trash2, ArrowUp, CheckCircle, Move, ZoomIn, ZoomOut, Save, Globe, Star, Clock, Building2, User, Facebook, Linkedin, BarChart3, AlertTriangle, Eye, Lock, Key, Mail, X as CloseIcon, UserMinus, ChevronDown, Youtube, Instagram as InstagramIcon, RefreshCw, RotateCcw
} from 'lucide-react';
import { UserAccount, BusinessProfile, AuthState, Role, isBusinessHidden } from './types';
import * as authApi from './services/authApi';
import * as cloudinary from './services/cloudinary';
import BusinessCard from './components/BusinessCard';
import BusinessDetail from './components/BusinessDetail';
import BusinessPublicPage from './components/BusinessPublicPage';
import { CATEGORIES_SORTED, getValueForLabel, getLabelForValue, categorySlugForApiRequest } from './src/shared/categories';
import { getProfileForbiddenFieldErrors, BUSINESS_FORBIDDEN_MESSAGE } from './src/shared/forbiddenWords';
import { mapApiMessage, userFacingError } from './src/shared/userMessages';

const REDIRECT_AFTER_LOGIN_KEY = 'empripanel_redirect_after_login';

const OFFICIAL_LINKS = [
  { 
    label: 'empripanel', 
    icon: InstagramIcon, 
    url: 'https://www.instagram.com/empripanel?igsh=amQxcDlydDR2emZy&utm_source=qr' 
  },
  { 
    label: 'empripanel', 
    icon: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ), 
    url: 'https://x.com/empripanel?s=21' 
  },
  { 
    label: 'Empripanel', 
    icon: Facebook, 
    url: 'https://www.facebook.com/share/1A3Kpqevqj/?mibextid=wwXIfr' 
  },
  { 
    label: 'Empripanel', 
    icon: Youtube, 
    url: 'https://youtube.com/@empripanel?si=74SodFvdGZYMNLiC' 
  },
  { 
    label: 'empripanel_', 
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.417 6.417 0 0 1-1.87-1.57v8.52c0 1.25-.2 2.5-.74 3.63-.52 1.13-1.32 2.14-2.34 2.87-1.03.73-2.27 1.2-3.56 1.34-1.28.14-2.6-.01-3.82-.45-1.22-.44-2.31-1.2-3.14-2.18-1.02-1.2-1.63-2.73-1.74-4.3-.11-1.57.25-3.18.99-4.57.74-1.39 1.88-2.56 3.25-3.29.9-.48 1.89-.78 2.9-.88v4.08a4.135 4.135 0 0 0-3.32 3.92c0 2.28 1.85 4.13 4.13 4.13 2.24 0 4.04-1.79 4.13-4.01V.02z" />
      </svg>
    ), 
    url: 'https://www.tiktok.com/@empripanel_?_r=1&_t=ZS-93nPYO4Ijye' 
  },
];

// --- Logo Component ---
const Logo: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <rect x="18" y="18" width="46" height="46" rx="8" fill="none" stroke="#00ffcc" strokeWidth="2" />
      <rect x="36" y="36" width="46" height="46" rx="8" fill="none" stroke="#00f0ff" strokeWidth="2" />
      <rect x="27" y="27" width="46" height="46" rx="8" fill="#00ffcc" />
    </svg>
  </div>
);

/** Banner crop: fixed 16:9; crop rect is always in source-image pixel space. */
const BANNER_ASPECT = 16 / 9;
const BANNER_OUTPUT_W = 1200;
const BANNER_OUTPUT_H = 675;

function maxCrop16x9(nw: number, nh: number) {
  const imgAspect = nw / nh;
  if (imgAspect >= BANNER_ASPECT) {
    const sh = nh;
    const sw = sh * BANNER_ASPECT;
    return { sx: (nw - sw) / 2, sy: 0, sw, sh };
  }
  const sw = nw;
  const sh = sw / BANNER_ASPECT;
  return { sx: 0, sy: (nh - sh) / 2, sw, sh };
}

function clampCrop(
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  nw: number,
  nh: number
) {
  const maxS = maxCrop16x9(nw, nh);
  const maxSw = maxS.sw;
  const maxSh = maxS.sh;
  const w = Math.min(sw, maxSw);
  const h = w / BANNER_ASPECT;
  let x = sx;
  let y = sy;
  x = Math.max(0, Math.min(nw - w, x));
  y = Math.max(0, Math.min(nh - h, y));
  return { sx: x, sy: y, sw: w, sh: h };
}

// --- Image Adjuster: 16:9 crop in source coordinates; export 1200x675 ---
const ImageAdjuster: React.FC<{
  imageSrc: string;
  onConfirm: (adjustedBase64: string) => void;
  onCancel: () => void;
}> = ({ imageSrc, onConfirm, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const panRef = useRef<{ sx: number; sy: number; cx: number; cy: number } | null>(null);

  const [nw, setNw] = useState(0);
  const [nh, setNh] = useState(0);
  const [crop, setCrop] = useState({ sx: 0, sy: 0, sw: 0, sh: 0 });
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setContainerW(w);
    };
    update();
    const raf = requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [imageSrc]);

  const onImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (w < 1 || h < 1) return;
    setNw(w);
    setNh(h);
    const m = maxCrop16x9(w, h);
    setCrop({ sx: m.sx, sy: m.sy, sw: m.sw, sh: m.sh });
  };

  const scalePx = containerW > 0 && crop.sw > 0 ? containerW / crop.sw : 0;

  const zoomFactor = (factor: number) => {
    if (!nw || !nh) return;
    setCrop((prev) => {
      const maxS = maxCrop16x9(nw, nh);
      const minSw = Math.max(32, Math.min(nw, nh * BANNER_ASPECT) * 0.04);
      let nsw = prev.sw * factor;
      nsw = Math.max(minSw, Math.min(maxS.sw, nsw));
      const nsh = nsw / BANNER_ASPECT;
      const cx = prev.sx + prev.sw / 2;
      const cy = prev.sy + prev.sh / 2;
      let sx = cx - nsw / 2;
      let sy = cy - nsh / 2;
      const c = clampCrop(sx, sy, nsw, nsh, nw, nh);
      return { sx: c.sx, sy: c.sy, sw: c.sw, sh: c.sh };
    });
  };

  const saveAdjustment = () => {
    const img = imgRef.current;
    if (!img || !nw || !nh || crop.sw <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = BANNER_OUTPUT_W;
    canvas.height = BANNER_OUTPUT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, BANNER_OUTPUT_W, BANNER_OUTPUT_H);
    onConfirm(canvas.toDataURL('image/jpeg', 0.85));
  };

  const startPan = (clientX: number, clientY: number) => {
    panRef.current = { sx: crop.sx, sy: crop.sy, cx: clientX, cy: clientY };
  };

  const movePan = (clientX: number, clientY: number) => {
    const p = panRef.current;
    if (!p || scalePx === 0 || !nw || !nh) return;
    const dsx = -(clientX - p.cx) / scalePx;
    const dsy = -(clientY - p.cy) / scalePx;
    setCrop((prev) => {
      const c = clampCrop(p.sx + dsx, p.sy + dsy, prev.sw, prev.sh, nw, nh);
      return { ...prev, sx: c.sx, sy: c.sy };
    });
  };

  const endPan = () => {
    panRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Ajustar banner (16:9)</h3>
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 font-bold uppercase tracking-widest">
          Encuadre fijo 16:9. Arrastrá para mover; zoom acerca o aleja el recorte (misma proporción en todos los dispositivos).
        </p>

        <div
          ref={containerRef}
          className="relative w-full aspect-[16/9] max-h-[min(50vh,22rem)] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border-4 border-teal-500/20 touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            startPan(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (panRef.current) movePan(e.clientX, e.clientY);
          }}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Ajustar"
            className="absolute pointer-events-none select-none max-w-none"
            draggable={false}
            onLoad={onImgLoad}
            style={{
              width: nw > 0 && scalePx > 0 ? nw * scalePx : undefined,
              height: nw > 0 && scalePx > 0 ? nh * scalePx : undefined,
              left: scalePx > 0 ? -crop.sx * scalePx : 0,
              top: scalePx > 0 ? -crop.sy * scalePx : 0,
              visibility: nw > 0 && scalePx > 0 ? 'visible' : 'hidden',
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 mt-6 mb-8 px-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => zoomFactor(1.08)}
              className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              title="Alejar"
            >
              <ZoomOut size={20} />
            </button>
            <button
              type="button"
              onClick={() => zoomFactor(1 / 1.08)}
              className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              title="Acercar"
            >
              <ZoomIn size={20} />
            </button>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Salida 1200×675</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={saveAdjustment}
            className="flex-1 bg-teal-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            <Save size={20} /> Guardar Encuadre
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Confirmation Modal ---
const ConfirmModal: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
  confirmDisabled?: boolean;
}> = ({ message, onConfirm, onCancel, variant = 'danger', confirmDisabled = false }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-teal-50 dark:bg-teal-900/20 text-teal-500'}`}>
            <AlertCircle size={32} />
          </div>
        </div>
        <p className="text-gray-900 dark:text-white font-black text-center text-xl mb-8 leading-tight">{message}</p>
        <div className="flex flex-col gap-3">
          <button disabled={confirmDisabled} onClick={onConfirm} className={`w-full text-white py-4 rounded-2xl font-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'}`}>
            {confirmDisabled ? 'Un momento…' : 'Confirmar'}
          </button>
          <button onClick={onCancel} className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-black transition-all active:scale-[0.98]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Toast Component ---
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[110] transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
    <div className="bg-teal-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-teal-500/50 backdrop-blur-md">
      <CheckCircle size={20} />
      <span className="font-black text-sm">{message}</span>
    </div>
  </div>
);

// --- Auth Modal ---
const AuthModal: React.FC<{
  onAuth: (user: UserAccount) => void
}> = ({ onAuth }) => {
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'EXPLORER' | 'BUSINESS'>('EXPLORER');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '', privateEmail: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const newErrors: Record<string, string> = {};

    if (!formData.username) newErrors.username = 'Completá este campo';
    if (!formData.password) newErrors.password = 'Completá este campo';
    if (!isLogin && !formData.privateEmail) newErrors.privateEmail = 'Completá este campo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!isLogin && (!acceptTerms || !acceptPrivacy)) {
      setGeneralError('Debés aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }

    try {
      if (isLogin) {
        const res = await authApi.login({ username: formData.username, password: formData.password });
        authApi.setSession(res.token, res.user);
        onAuth(authApi.toAppUser(res.user));
      } else {
        const res = await authApi.register({
          username: formData.username,
          email: formData.privateEmail,
          password: formData.password,
          role,
        });
        authApi.setSession(res.token, res.user);
        onAuth(authApi.toAppUser(res.user));
      }
    } catch (err: unknown) {
      setGeneralError(
        userFacingError(
          err,
          isLogin ? 'Credenciales inválidas' : 'No pudimos completar el registro. Inténtalo nuevamente.'
        )
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-gray-950 p-6 overflow-y-auto">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-8">
          <Logo className="w-24 h-24" />
        </div>
        
        {step === 'type' && !isLogin ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center">Unite a Empripanel</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center font-bold">Elegí cómo querés usar la plataforma.</p>
            <div className="space-y-4">
              <button onClick={() => { setRole('EXPLORER'); setStep('form'); }} className="w-full flex items-center justify-between p-6 bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 rounded-3xl border-2 border-transparent hover:border-teal-500 transition-all group shadow-sm">
                <div className="text-left"><h3 className="font-black text-lg">Soy Usuario</h3><p className="text-xs font-bold opacity-80">Quiero descubrir nuevos negocios.</p></div>
                <ArrowRight />
              </button>
              <button onClick={() => { setRole('BUSINESS'); setStep('form'); }} className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-3xl border-2 border-transparent hover:border-teal-500 transition-all group shadow-sm">
                <div className="text-left"><h3 className="font-black text-lg">Soy Negocio</h3><p className="text-xs font-bold text-gray-600 dark:text-gray-400">Quiero que mi local destaque.</p></div>
                <ArrowRight />
              </button>
            </div>
            <button onClick={() => setIsLogin(true)} className="w-full text-sm font-black text-teal-600 dark:text-teal-400 underline decoration-2 underline-offset-4">¿Ya tenés cuenta? Ingresá</button>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center">{isLogin ? '¡Bienvenido!' : 'Crear Cuenta'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input className={`w-full bg-gray-50 dark:bg-gray-900 dark:text-white border-2 rounded-2xl px-5 py-4 font-bold outline-none transition-all ${errors.username ? 'border-red-500' : 'border-gray-100 dark:border-gray-800 focus:border-teal-500'}`} placeholder="Usuario" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                {errors.username && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.username}</p>}
              </div>
              {!isLogin && (
                <div>
                  <input type="email" className={`w-full bg-gray-50 dark:bg-gray-900 dark:text-white border-2 rounded-2xl px-5 py-4 font-bold outline-none transition-all ${errors.privateEmail ? 'border-red-500' : 'border-gray-100 dark:border-gray-800 focus:border-teal-500'}`} placeholder="Correo privado" value={formData.privateEmail} onChange={e => setFormData({...formData, privateEmail: e.target.value})} />
                  {errors.privateEmail && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.privateEmail}</p>}
                </div>
              )}
              <div>
                <input type="password" className={`w-full bg-gray-50 dark:bg-gray-900 dark:text-white border-2 rounded-2xl px-5 py-4 font-bold outline-none transition-all ${errors.password ? 'border-red-500' : 'border-gray-100 dark:border-gray-800 focus:border-teal-500'}`} placeholder="Contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                {errors.password && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.password}</p>}
                {isLogin && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 ml-1">¿Olvidaste tu contraseña? Contactar a soporte@empripanel.com</p>
                )}
              </div>
              
              {!isLogin && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-teal-600 focus:ring-teal-500 dark:bg-gray-900"
                      checked={acceptTerms}
                      onChange={e => setAcceptTerms(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      He leído y aceptado los <a href="https://drive.google.com/file/d/16YIXBX5bkiNGHllffhE_20KbouGVgUtC/view" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Términos y Condiciones</a>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-teal-600 focus:ring-teal-500 dark:bg-gray-900"
                      checked={acceptPrivacy}
                      onChange={e => setAcceptPrivacy(e.target.checked)}
                    />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      He leído y aceptado la <a href="https://drive.google.com/file/d/1Vklp_TxRnegMc3ZclNsZLCvxuV-U5nb1/view" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Política de Privacidad</a>
                    </span>
                  </label>
                  <p className="text-center text-[10px] font-bold text-gray-400 mt-2 italic">Toda esta información es privada.</p>
                </div>
              )}

              {/* Error posicionado justo sobre el botón */}
              {generalError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-in shake">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-xs font-black">{generalError}</p>
                </div>
              )}

              <button 
                disabled={!isLogin && (!acceptTerms || !acceptPrivacy)}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black shadow-xl shadow-teal-500/20 transition-all active:scale-[0.98]"
              >
                {isLogin ? 'Ingresar' : 'Registrarme'}
              </button>
            </form>
            <button onClick={() => { setIsLogin(!isLogin); setStep('type'); setErrors({}); setGeneralError(null); setAcceptTerms(false); setAcceptPrivacy(false); }} className="w-full text-sm font-black text-teal-600 dark:text-teal-400 underline decoration-2 underline-offset-4">
              {isLogin ? '¿No tenés cuenta? Registrate' : 'Volver'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Create/Edit Profile Modal ---
const ProfileEditorModal: React.FC<{
  onClose: () => void,
  ownerId: string,
  onSave: () => void | Promise<void>,
  initialData?: BusinessProfile
}> = ({ onClose, ownerId, onSave, initialData }) => {
  const TITLE_MAX_CHARS = 21;
  const SLOGAN_MAX_CHARS = 21;

  // Keeps words intact when possible (trims at last space); always guarantees <= maxChars.
  const limitText = (input: string, maxChars: number) => {
    const text = input ?? '';
    if (text.length <= maxChars) return text;
    const slice = text.slice(0, maxChars);
    const lastSpace = slice.lastIndexOf(' ');
    return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adjustingImage, setAdjustingImage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => initialData ? {
    ...initialData,
    publicName: limitText(initialData.publicName, TITLE_MAX_CHARS),
    shortDescription: limitText(initialData.shortDescription, SLOGAN_MAX_CHARS),
  } : {
    publicName: '',
    category: 'Gastronomía',
    shortDescription: '',
    fullDescription: '',
    logo: '',
    redirectionUrl: '',
    location: '',
    publicPhone: '',
    publicEmail: '',
    socials: { instagram: '', twitter: '', linkedin: '', tiktok: '', facebook: '', website: '', youtube: '' }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdjustingImage((prev) => {
      const oldBlob = prev?.startsWith('blob:') ? prev : null;
      const next = URL.createObjectURL(file);
      if (oldBlob) queueMicrotask(() => URL.revokeObjectURL(oldBlob));
      return next;
    });
    e.target.value = '';
  };

  const handleAdjustConfirm = (adjustedBase64: string) => {
    const blobUrl = adjustingImage?.startsWith('blob:') ? adjustingImage : null;
    handleInputChange('logo', adjustedBase64);
    setAdjustingImage(null);
    if (blobUrl) queueMicrotask(() => URL.revokeObjectURL(blobUrl));
  };

  const dismissAdjustingImage = () => {
    setAdjustingImage((prev) => {
      const blobUrl = prev?.startsWith('blob:') ? prev : null;
      queueMicrotask(() => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      });
      return null;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const newErrors: Record<string, string> = {};
    if (!formData.publicName) newErrors.publicName = 'Completá este campo';
    if (!formData.shortDescription) newErrors.shortDescription = 'Completá este campo';
    if (!formData.fullDescription) newErrors.fullDescription = 'Completá este campo';
    if (!formData.logo) newErrors.logo = 'Subí o pegá la imagen del banner';
    if (!formData.redirectionUrl) newErrors.redirectionUrl = 'Completá este campo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const forbiddenErrors = getProfileForbiddenFieldErrors(formData);
    if (Object.keys(forbiddenErrors).length > 0) {
      setErrors(forbiddenErrors);
      setGeneralError(BUSINESS_FORBIDDEN_MESSAGE);
      return;
    }

    if (initialData) {
      setSubmitting(true);
      try {
        let bannerImageUrl: string;
        if (formData.logo.startsWith('data:')) {
          const res = await fetch(formData.logo);
          const blob = await res.blob();
          const file = new File([blob], 'banner.jpg', { type: blob.type || 'image/jpeg' });
          bannerImageUrl = await cloudinary.uploadImage(file);
        } else if (cloudinary.isValidImageUrl(formData.logo)) {
          bannerImageUrl = formData.logo.trim();
        } else {
          setErrors({ logo: 'La URL de la imagen no es válida' });
          setSubmitting(false);
          return;
        }
        const body: authApi.CreateBusinessBody = {
          name: limitText(formData.publicName.trim(), TITLE_MAX_CHARS),
          category: formData.category.trim(),
          bannerImageUrl,
          redirectUrl: formData.redirectionUrl.trim(),
          slogan: limitText(formData.shortDescription.trim(), SLOGAN_MAX_CHARS),
          description: formData.fullDescription.trim(),
          location: formData.location?.trim() || undefined,
          phone: formData.publicPhone?.trim() || undefined,
          contactEmail: formData.publicEmail?.trim() || undefined,
          website: formData.socials.website?.trim() || undefined,
          instagram: formData.socials.instagram?.trim() || undefined,
          tiktok: formData.socials.tiktok?.trim() || undefined,
          x: formData.socials.twitter?.trim() || undefined,
          linkedin: formData.socials.linkedin?.trim() || undefined,
          facebook: formData.socials.facebook?.trim() || undefined,
          youtube: formData.socials.youtube?.trim() || undefined,
        };
        await authApi.updateBusiness(initialData.id, body);
        await onSave();
      } catch (error: unknown) {
        setGeneralError(userFacingError(error, 'No pudimos guardar los cambios. Inténtalo nuevamente.'));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Create: resolve banner URL then POST to API
    setSubmitting(true);
    try {
      let bannerImageUrl: string;
      if (formData.logo.startsWith('data:')) {
        const res = await fetch(formData.logo);
        const blob = await res.blob();
        const file = new File([blob], 'banner.jpg', { type: blob.type || 'image/jpeg' });
        bannerImageUrl = await cloudinary.uploadImage(file);
      } else if (cloudinary.isValidImageUrl(formData.logo)) {
        bannerImageUrl = formData.logo.trim();
      } else {
        setErrors({ logo: 'La URL de la imagen no es válida' });
        setSubmitting(false);
        return;
      }

      const body: authApi.CreateBusinessBody = {
        name: limitText(formData.publicName.trim(), TITLE_MAX_CHARS),
        category: formData.category.trim(),
        bannerImageUrl,
        redirectUrl: formData.redirectionUrl.trim(),
        slogan: limitText(formData.shortDescription.trim(), SLOGAN_MAX_CHARS),
        description: formData.fullDescription.trim(),
        location: formData.location?.trim() || undefined,
        phone: formData.publicPhone?.trim() || undefined,
        contactEmail: formData.publicEmail?.trim() || undefined,
        website: formData.socials.website?.trim() || undefined,
        instagram: formData.socials.instagram?.trim() || undefined,
        tiktok: formData.socials.tiktok?.trim() || undefined,
        x: formData.socials.twitter?.trim() || undefined,
        linkedin: formData.socials.linkedin?.trim() || undefined,
        facebook: formData.socials.facebook?.trim() || undefined,
        youtube: formData.socials.youtube?.trim() || undefined,
      };

      const created = await authApi.createBusiness(body);
      if (created) {
        setFormData({
          publicName: '',
          category: 'Gastronomía',
          shortDescription: '',
          fullDescription: '',
          logo: '',
          redirectionUrl: '',
          location: '',
          publicPhone: '',
          publicEmail: '',
          socials: { instagram: '', twitter: '', linkedin: '', tiktok: '', facebook: '', website: '', youtube: '' },
        });
        setErrors({});
        await onSave();
      }
    } catch (error: unknown) {
      setGeneralError(userFacingError(error, 'No pudimos crear la ficha. Inténtalo nuevamente.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    let nextValue = value;
    if (field === 'publicName') {
      nextValue = limitText(String(value ?? ''), TITLE_MAX_CHARS);
    } else if (field === 'shortDescription') {
      nextValue = limitText(String(value ?? ''), SLOGAN_MAX_CHARS);
    }
    setFormData({ ...formData, [field]: nextValue });
    if (errors[field]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[field];
      setErrors(updatedErrors);
    }
  };

  const inputClass = (error?: string) => `w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-bold placeholder:text-gray-400 outline-none transition-all ${error ? 'border-red-500' : 'border-gray-100 dark:border-gray-700 focus:border-teal-500 focus:bg-white dark:focus:bg-gray-900'}`;
  const socialInputClass = (error?: string) =>
    `bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold placeholder:text-gray-400 outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-gray-900 transition-all ${error ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`;

  const handleSocialChange = (field: keyof typeof formData.socials, value: string) => {
    const errKey =
      field === 'website'
        ? 'socialWebsite'
        : field === 'instagram'
          ? 'socialInstagram'
          : field === 'tiktok'
            ? 'socialTiktok'
            : field === 'twitter'
              ? 'socialTwitter'
              : field === 'linkedin'
                ? 'socialLinkedin'
                : field === 'facebook'
                  ? 'socialFacebook'
                  : 'socialYoutube';
    setFormData({ ...formData, socials: { ...formData.socials, [field]: value } });
    if (errors[errKey]) {
      const next = { ...errors };
      delete next[errKey];
      setErrors(next);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
      {adjustingImage ? (
        <ImageAdjuster
          key={adjustingImage}
          imageSrc={adjustingImage}
          onConfirm={handleAdjustConfirm}
          onCancel={dismissAdjustingImage}
        />
      ) : null}
      
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <Plus className="rotate-45" size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">{initialData ? 'Editar Ficha' : 'Nueva Ficha Pública'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                maxLength={TITLE_MAX_CHARS}
                className={inputClass(errors.publicName)}
                placeholder="Nombre Público *"
                value={formData.publicName}
                onChange={e => handleInputChange('publicName', e.target.value)}
              />
              {errors.publicName && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.publicName}</p>}
            </div>
            <div>
            <select className={`w-full bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white font-bold outline-none focus:border-teal-500 transition-all cursor-pointer overflow-y-auto ${errors.category ? 'border-red-500' : 'border-gray-100 dark:border-gray-700'}`} value={formData.category} onChange={e => handleInputChange('category', e.target.value)}>
              {CATEGORIES_SORTED.map(c => <option key={c.value} value={c.label} className="text-sm">{c.label}</option>)}
            </select>
            {errors.category && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.category}</p>}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Banner de Negocio *</h4>
            {formData.logo && (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 mb-3 group">
                <img src={formData.logo} className="w-full h-full object-cover" alt="Preview" />
                <button type="button" onClick={() => handleInputChange('logo', '')} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="rotate-45" size={16} /></button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 py-3 rounded-xl font-bold border-2 border-teal-100 dark:border-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/20 transition-all"><Upload size={18} /> Subir desde Galería</button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <div className="flex-[2]">
                <input className={inputClass(errors.logo)} placeholder="O pega URL aquí..." value={formData.logo.startsWith('data:') ? '' : formData.logo} onChange={e => handleInputChange('logo', e.target.value)} />
              </div>
            </div>
            {errors.logo && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.logo}</p>}
          </div>

          <div>
            <h4 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2">Enlace Principal</h4>
            <input className={inputClass(errors.redirectionUrl)} placeholder="Link Web/IG/Social *" value={formData.redirectionUrl} onChange={e => handleInputChange('redirectionUrl', e.target.value)} />
            {errors.redirectionUrl && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.redirectionUrl}</p>}
          </div>

          <div>
            <input
              maxLength={SLOGAN_MAX_CHARS}
              className={inputClass(errors.shortDescription)}
              placeholder="Slogan Corto *"
              value={formData.shortDescription}
              onChange={e => handleInputChange('shortDescription', e.target.value)}
            />
            {errors.shortDescription && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.shortDescription}</p>}
          </div>

          <div>
            <textarea rows={3} className={inputClass(errors.fullDescription)} placeholder="Descripción Completa *" value={formData.fullDescription} onChange={e => handleInputChange('fullDescription', e.target.value)} />
            {errors.fullDescription && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.fullDescription}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input className={inputClass(errors.location)} placeholder="Ubicación (Opcional)" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} />
              {errors.location && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.location}</p>}
            </div>
            <div>
              <input className={inputClass(errors.publicPhone)} placeholder="Teléfono Público (Opcional)" value={formData.publicPhone} onChange={e => handleInputChange('publicPhone', e.target.value)} />
              {errors.publicPhone && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.publicPhone}</p>}
            </div>
          </div>

          <div>
            <input type="email" className={inputClass(errors.publicEmail)} placeholder="Email Público (Opcional)" value={formData.publicEmail} onChange={e => handleInputChange('publicEmail', e.target.value)} />
            {errors.publicEmail && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.publicEmail}</p>}
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Web y Redes (Opcional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input className={`w-full ${socialInputClass(errors.socialWebsite)}`} placeholder="Sitio Web" value={formData.socials.website} onChange={e => handleSocialChange('website', e.target.value)} />
                {errors.socialWebsite && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialWebsite}</p>}
              </div>
              <div>
                <input className={`w-full ${socialInputClass(errors.socialInstagram)}`} placeholder="Instagram" value={formData.socials.instagram} onChange={e => handleSocialChange('instagram', e.target.value)} />
                {errors.socialInstagram && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialInstagram}</p>}
              </div>
              <div>
                <input className={`w-full ${socialInputClass(errors.socialTiktok)}`} placeholder="TikTok" value={formData.socials.tiktok} onChange={e => handleSocialChange('tiktok', e.target.value)} />
                {errors.socialTiktok && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialTiktok}</p>}
              </div>
              <div>
                <input className={`w-full ${socialInputClass(errors.socialTwitter)}`} placeholder="Twitter / X" value={formData.socials.twitter} onChange={e => handleSocialChange('twitter', e.target.value)} />
                {errors.socialTwitter && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialTwitter}</p>}
              </div>
              <div>
                <input className={`w-full ${socialInputClass(errors.socialLinkedin)}`} placeholder="LinkedIn" value={formData.socials.linkedin} onChange={e => handleSocialChange('linkedin', e.target.value)} />
                {errors.socialLinkedin && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialLinkedin}</p>}
              </div>
              <div>
                <input className={`w-full ${socialInputClass(errors.socialFacebook)}`} placeholder="Facebook" value={formData.socials.facebook} onChange={e => handleSocialChange('facebook', e.target.value)} />
                {errors.socialFacebook && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialFacebook}</p>}
              </div>
              <div>
                <input className={`w-full ${socialInputClass(errors.socialYoutube)}`} placeholder="YouTube" value={formData.socials.youtube} onChange={e => handleSocialChange('youtube', e.target.value)} />
                {errors.socialYoutube && <p className="text-red-600 text-[10px] font-black mt-1 ml-2">{errors.socialYoutube}</p>}
              </div>
            </div>
          </div>
          
          {/* Error posicionado justo sobre el botón */}
          {generalError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-in shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-black">{generalError}</p>
            </div>
          )}

          <button className="w-full bg-teal-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" disabled={submitting}>
            {submitting ? (initialData ? 'Guardando…' : 'Creando…') : (initialData ? 'Actualizar Ficha' : 'Crear Ficha Pública')}
          </button>
        </form>
      </div>
    </div>
  );
};

/** Fisher–Yates shuffle (copy) for Explore order when no ranking is active */
function shuffleExploreIds(ids: string[]): string[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

// --- App Main ---
const App: React.FC = () => {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [myProfiles, setMyProfiles] = useState<BusinessProfile[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchResults, setSearchResults] = useState<BusinessProfile[] | null>(null);
  const [categoryResults, setCategoryResults] = useState<BusinessProfile[] | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BusinessProfile | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'home' | 'my-business' | 'profile'>('home');
  /** Explore ranking: null = default list; otherwise fetch from /api/rankings/* */
  const [exploreRankingFilter, setExploreRankingFilter] = useState<'clicks' | 'new' | 'likes' | null>(null);
  const [rankingExploreProfiles, setRankingExploreProfiles] = useState<BusinessProfile[] | null>(null);
  const [rankingExploreLoading, setRankingExploreLoading] = useState(false);
  const toggleExploreRanking = (key: 'clicks' | 'new' | 'likes') => {
    setExploreRankingFilter((prev) => (prev === key ? null : key));
  };
  /** Bump when user returns to Explore tab so the list reshuffles */
  const [exploreVisitKey, setExploreVisitKey] = useState(0);
  const prevActiveTabRef = useRef(activeTab);
  const [isTopInView, setIsTopInView] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [deleteBusinessLoading, setDeleteBusinessLoading] = useState(false);
  const [hiddenBusinesses, setHiddenBusinesses] = useState<BusinessProfile[]>([]);
  const [toast, setToast] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [featuredCategory, setFeaturedCategory] = useState('');
  
  // Admin Reset Password State
  const [resetUser, setResetUser] = useState({ username: '', newPass: '' });
  
  // User Email Edit State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [emailEditError, setEmailEditError] = useState<string | null>(null);

  // Change Password State
  const [showChangePass, setShowChangePass] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ current: '', new: '', confirm: '' });

  // Delete Account Confirmation State
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);

  // Loading state for profile API actions (email, password, delete, role)
  const [profileActionLoading, setProfileActionLoading] = useState(false);

  // User's liked/reported business IDs (for UI state; liked IDs loaded from API)
  const [likedBusinessIds, setLikedBusinessIds] = useState<string[]>([]);
  const [reportedBusinessIds, setReportedBusinessIds] = useState<string[]>([]);
  /** All businesses the user has ever clicked (persisted); not limited to profile history. */
  const [visitedBusinessIds, setVisitedBusinessIds] = useState<string[]>([]);
  // Saved (liked) businesses and visit history from backend
  const [savedBusinesses, setSavedBusinesses] = useState<BusinessProfile[]>([]);
  const [visitHistory, setVisitHistory] = useState<{ business: BusinessProfile; visitedAt: string }[]>([]);

  // Public business page from path /business/:id
  const [pathBusinessId, setPathBusinessId] = useState<string | null>(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const match = path.match(/^\/business\/([^/]+)$/);
    return match ? match[1] : null;
  });

  const headerRef = useRef<HTMLDivElement>(null);

  const refreshProfilesList = useCallback(async () => {
    try {
      const list = await authApi.getBusinesses();
      setProfiles(list.map(authApi.businessToProfile));
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) console.error('Explore: failed to load businesses', err);
    }
  }, []);

  const refreshPanelProfiles = useCallback(async () => {
    if (!authState.isAuthenticated || authState.user?.role !== 'BUSINESS') return;
    try {
      const list = await authApi.getPanelBusinesses();
      setMyProfiles(list.map(authApi.businessToProfile));
    } catch {
      // keep current panel state on error
    }
  }, [authState.isAuthenticated, authState.user?.role]);

  const fetchHiddenBusinesses = useCallback(async () => {
    if (authState.user?.username !== 'Empripanel') return;
    try {
      const list = await authApi.getHiddenBusinesses();
      setHiddenBusinesses(list.map(authApi.businessToProfile));
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) console.error('Admin: failed to load hidden businesses', err);
      setHiddenBusinesses([]);
    }
  }, [authState.user?.username]);

  useEffect(() => {
    const token = authApi.getStoredToken();
    const storedUser = authApi.getStoredUser();
    if (token && storedUser && authApi.isTokenValid()) {
      setAuthState({ user: authApi.toAppUser(storedUser), isAuthenticated: true });
    } else {
      void authApi.clearSession();
    }

    // Listener de scroll para el botón Back to Top
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);

    // Deep linking handler: check for #/business/ID in URL
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/business/')) {
        const id = hash.split('#/business/')[1];
        if (id) {
          setSelectedProfileId(id);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    // Path-based deep link: /business/:id
    const syncPathBusinessId = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/business\/([^/]+)$/);
      setPathBusinessId(match ? match[1] : null);
    };
    syncPathBusinessId();
    window.addEventListener('popstate', syncPathBusinessId);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', syncPathBusinessId);
    };
  }, []);

  // Load businesses from API when authenticated; load liked IDs, saved list, and visit history; fetch featured category
  useEffect(() => {
    if (!authState.isAuthenticated) return;
    refreshProfilesList();
    refreshPanelProfiles();
    authApi.getLikedBusinessIds().then(setLikedBusinessIds).catch(() => setLikedBusinessIds([]));
    authApi.getLikedBusinesses().then(setSavedBusinesses).catch(() => setSavedBusinesses([]));
    authApi.getVisitHistory().then(setVisitHistory).catch(() => setVisitHistory([]));
    authApi
      .getUserInteractionState()
      .then(({ visitedBusinessIds: v, reportedBusinessIds: r }) => {
        setVisitedBusinessIds(v);
        setReportedBusinessIds(r);
      })
      .catch(() => {
        setVisitedBusinessIds([]);
        setReportedBusinessIds([]);
      });
    authApi.getFeaturedCategory()
      .then((r) => setFeaturedCategory(r.featuredCategory))
      .catch(err => {
        if (typeof console !== 'undefined' && console.error) console.error('Explore: failed to load featured category', err);
        setFeaturedCategory('');
      });
  }, [authState.isAuthenticated, refreshProfilesList, refreshPanelProfiles]);

  // Admin: load hidden businesses when on profile tab
  useEffect(() => {
    if (authState.user?.username === 'Empripanel' && activeTab === 'profile') {
      fetchHiddenBusinesses();
    }
  }, [authState.user?.username, activeTab, fetchHiddenBusinesses]);

  // When category dropdown changes: fetch by category or clear to default list
  useEffect(() => {
    if (categoryFilter === '') {
      setCategoryResults(null);
      refreshProfilesList();
      return;
    }
    authApi.getBusinessesByCategory(categorySlugForApiRequest(categoryFilter))
      .then(list => setCategoryResults(list.map(authApi.businessToProfile)))
      .catch(err => {
        if (typeof console !== 'undefined' && console.error) console.error('Explore: failed to load category', err);
        setCategoryResults([]);
      });
  }, [categoryFilter, refreshProfilesList]);

  // Explore ranking: fetch when a bubble is active; clear when toggled off
  useEffect(() => {
    if (exploreRankingFilter === null) {
      setRankingExploreProfiles(null);
      setRankingExploreLoading(false);
      return;
    }
    let cancelled = false;
    setRankingExploreLoading(true);
    setRankingExploreProfiles(null);
    const run =
      exploreRankingFilter === 'clicks'
        ? authApi.getRankingsTopClicked()
        : exploreRankingFilter === 'likes'
          ? authApi.getRankingsTopLiked()
          : authApi.getRankingsNew();
    run
      .then((list) => {
        if (!cancelled) setRankingExploreProfiles(list.map(authApi.businessToProfile));
      })
      .catch((err) => {
        if (typeof console !== 'undefined' && console.error) console.error('Explore: ranking fetch failed', err);
        if (!cancelled) setRankingExploreProfiles([]);
      })
      .finally(() => {
        if (!cancelled) setRankingExploreLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [exploreRankingFilter]);

  useEffect(() => {
    const prev = prevActiveTabRef.current;
    prevActiveTabRef.current = activeTab;
    if (activeTab === 'home' && prev !== 'home') {
      setExploreVisitKey((k) => k + 1);
    }
  }, [activeTab]);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const businessId = params.get('business');

  if (businessId) {
    setSelectedProfileId(businessId);
  }
}, []);

  // Control global de scroll para modales
  useEffect(() => {
    if (selectedProfileId || showProfileModal || deletingProfileId || showDeleteAccountConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [selectedProfileId, showProfileModal, deletingProfileId, showDeleteAccountConfirm]);

  const handleShuffle = () => {
    setProfiles((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleScrollToStart = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = useCallback(async () => {
    const q = search.trim();
    if (!q) {
      setSearchResults(null);
      refreshProfilesList();
      return;
    }
    try {
      const list = await authApi.getSearchBusinesses(q);
      setSearchResults(list.map(authApi.businessToProfile));
    } catch (err) {
      if (typeof console !== 'undefined' && console.error) console.error('Explore: search failed', err);
      setSearchResults([]);
    }
  }, [search, refreshProfilesList]);

  const handleAuth = (user: UserAccount) => {
    setAuthState({ user, isAuthenticated: true });
    const redirectPath = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY) : null;
    if (redirectPath) {
      sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      const match = redirectPath.match(/^\/business\/([^/]+)$/);
      if (match) {
        setPathBusinessId(match[1]);
        window.history.pushState({}, '', redirectPath);
      }
    }
  };

  const handleLogout = async () => {
    await authApi.clearSession();
    setAuthState({ user: null, isAuthenticated: false });
    setLikedBusinessIds([]);
    setReportedBusinessIds([]);
    setVisitedBusinessIds([]);
    setSavedBusinesses([]);
    setVisitHistory([]);
    setActiveTab('home');
  };

  const handleDeleteAccount = async () => {
    if (!authState.user) return;
    setProfileActionLoading(true);
    try {
      await authApi.deleteAccount();
      await authApi.clearSession();
      setAuthState({ user: null, isAuthenticated: false });
      setLikedBusinessIds([]);
      setReportedBusinessIds([]);
      setVisitedBusinessIds([]);
      setSavedBusinesses([]);
      setVisitHistory([]);
      setActiveTab('home');
      setShowDeleteAccountConfirm(false);
      setToast({ message: 'Tu cuenta fue eliminada correctamente', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 5000);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos eliminar tu cuenta. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleVisit = useCallback(async (p: BusinessProfile) => {
    if (authState.isAuthenticated) {
      try {
        const res = await authApi.registerClick(p.id);
        setProfiles((prev) => prev.map((b) => (b.id === p.id ? { ...b, clicks: res.clickCount } : b)));
        setMyProfiles((prev) => prev.map((b) => (b.id === p.id ? { ...b, clicks: res.clickCount } : b)));
        setRankingExploreProfiles((prev) =>
          prev ? prev.map((b) => (b.id === p.id ? { ...b, clicks: res.clickCount } : b)) : prev
        );
        setVisitedBusinessIds((prev) => (prev.includes(p.id) ? prev : [...prev, p.id]));
        const history = await authApi.getVisitHistory();
        setVisitHistory(history);
      } catch {
        // continue to open URL even if click tracking fails
      }
    }
    const url = p.redirectionUrl.startsWith('http') ? p.redirectionUrl : `https://${p.redirectionUrl}`;
    window.open(url, '_blank');
  }, [authState.isAuthenticated]);

  const handleShare = useCallback((p: BusinessProfile) => {
  const shareUrl = ${window.location.origin}/business/${p.id};

  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      url: shareUrl,
      title: p.publicName,
      text: p.shortDescription,
    }).then(() => {
      setToast({ message: 'Enlace compartido', visible: true });

      setTimeout(() =>
        setToast(prev => ({ ...prev, visible: false })),
      3000);

    }).catch(() => {
      navigator.clipboard.writeText(shareUrl);

      setToast({
        message: 'Enlace copiado al portapapeles',
        visible: true
      });

      setTimeout(() =>
        setToast(prev => ({ ...prev, visible: false })),
      3000);
    });

  } else {
    navigator.clipboard.writeText(shareUrl);

    setToast({
      message: 'Enlace copiado al portapapeles',
      visible: true
    });

    setTimeout(() =>
      setToast(prev => ({ ...prev, visible: false })),
    3000);
  }
}, []);

  const handleLike = useCallback(async (pid: string) => {
    if (!authState.isAuthenticated || !authState.user) return;
    try {
      const res = await authApi.toggleLike(pid);
      setLikedBusinessIds((prev) =>
        res.liked ? [...new Set([...prev, pid])] : prev.filter((id) => id !== pid)
      );
      setProfiles((prev) => prev.map((b) => (b.id === pid ? { ...b, likes: res.likeCount } : b)));
      setMyProfiles((prev) => prev.map((b) => (b.id === pid ? { ...b, likes: res.likeCount } : b)));
      setRankingExploreProfiles((prev) =>
        prev ? prev.map((b) => (b.id === pid ? { ...b, likes: res.likeCount } : b)) : prev
      );
      const list = await authApi.getLikedBusinesses();
      setSavedBusinesses(list);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos actualizar el like. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  }, [authState.isAuthenticated, authState.user]);

  const handleReport = useCallback(async (pid: string) => {
    if (!authState.isAuthenticated || !authState.user) return;
    try {
      const res = await authApi.toggleReport(pid);
      setReportedBusinessIds(prev => res.reported ? [...prev, pid] : prev.filter(id => id !== pid));
      setProfiles(prev => prev.map(b => b.id === pid ? { ...b, reportCount: res.reportCount } : b));
      setMyProfiles(prev => prev.map(b => b.id === pid ? { ...b, reportCount: res.reportCount } : b));
      setToast({
        message: res.reported ? 'Reporte enviado correctamente' : 'Reporte retirado correctamente',
        visible: true,
      });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos enviar el reporte. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    }
  }, [authState.isAuthenticated, authState.user]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser.username || !resetUser.newPass) return;
    try {
      const res = await authApi.resetAdminUserPassword(resetUser.username, resetUser.newPass);
      setToast({ message: 'Contraseña del usuario actualizada correctamente', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos actualizar la contraseña. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    }
  };

  const handleUpdateEmail = async () => {
    if (!tempEmail) return;
    setEmailEditError(null);
    setProfileActionLoading(true);
    try {
      const res = await authApi.updateEmail(tempEmail);
      const token = authApi.getStoredToken();
      if (token) authApi.setSession(token, res.user);
      setAuthState(prev => ({ ...prev, user: authApi.toAppUser(res.user) }));
      setIsEditingEmail(false);
      setToast({ message: 'Correo actualizado correctamente', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      setEmailEditError(userFacingError(err, 'No pudimos actualizar el correo. Inténtalo nuevamente.'));
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleToggleRole = async () => {
    if (!authState.user) return;
    setProfileActionLoading(true);
    try {
      const res = await authApi.switchRole();
      const token = authApi.getStoredToken();
      const stored = authApi.getStoredUser();
      if (token && stored) {
        const updatedBackendUser = { ...stored, role: res.role };
        authApi.setSession(token, updatedBackendUser);
        setAuthState(prev => ({ ...prev, user: authApi.toAppUser(updatedBackendUser) }));
      }
      setToast({
        message:
          res.role === 'BUSINESS'
            ? 'Perfil cambiado a negocio correctamente'
            : 'Perfil cambiado a explorador correctamente',
        visible: true,
      });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos cambiar el perfil. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePassForm.current || !changePassForm.new || !changePassForm.confirm) {
      setToast({ message: 'Completá todos los campos', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      return;
    }
    if (changePassForm.new !== changePassForm.confirm) {
      setToast({ message: 'Las contraseñas no coinciden', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      return;
    }
    setProfileActionLoading(true);
    try {
      await authApi.changePassword(changePassForm.current, changePassForm.new, changePassForm.confirm);
      setToast({ message: 'Contraseña modificada correctamente', visible: true });
      setShowChangePass(false);
      setChangePassForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos cambiar la contraseña. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    } finally {
      setProfileActionLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingProfileId) return;
    setDeleteBusinessLoading(true);
    try {
      await authApi.deleteBusiness(deletingProfileId);
      setProfiles(prev => prev.filter(p => p.id !== deletingProfileId));
      setMyProfiles(prev => prev.filter(p => p.id !== deletingProfileId));
      if (selectedProfileId === deletingProfileId) setSelectedProfileId(null);
      setDeletingProfileId(null);
      await refreshProfilesList();
      await refreshPanelProfiles();
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos eliminar la ficha. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    } finally {
      setDeleteBusinessLoading(false);
    }
  };

  const handleHide = useCallback(async (businessId: string) => {
    try {
      await authApi.hideBusiness(businessId);
      setToast({ message: 'Ficha ocultada correctamente', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      await refreshProfilesList();
      await fetchHiddenBusinesses();
      if (selectedProfileId === businessId) setSelectedProfileId(null);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos ocultar la ficha. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    }
  }, [refreshProfilesList, fetchHiddenBusinesses, selectedProfileId]);

  const handleRestore = useCallback(async (businessId: string) => {
    try {
      await authApi.restoreBusiness(businessId);
      setToast({ message: 'Ficha restaurada correctamente', visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
      await refreshProfilesList();
      await fetchHiddenBusinesses();
      if (selectedProfileId === businessId) setSelectedProfileId(null);
    } catch (err) {
      setToast({ message: userFacingError(err, 'No pudimos restaurar la ficha. Inténtalo nuevamente.'), visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
    }
  }, [refreshProfilesList, fetchHiddenBusinesses, selectedProfileId]);

  const exploreVisibleIdsKey = useMemo(() => {
    const base =
      exploreRankingFilter !== null
        ? (rankingExploreProfiles ?? [])
        : categoryFilter === ''
          ? (searchResults !== null ? searchResults : profiles)
          : (categoryResults ?? []);
    return base
      .filter((p) => p.status === 'visible')
      .map((p) => p.id)
      .join('\u0001');
  }, [exploreRankingFilter, rankingExploreProfiles, categoryFilter, searchResults, profiles, categoryResults]);

  const exploreShuffleIds = useMemo((): string[] | null => {
    if (exploreRankingFilter !== null) return null;
    const base =
      categoryFilter === ''
        ? (searchResults !== null ? searchResults : profiles)
        : (categoryResults ?? []);
    const visible = base.filter((p) => p.status === 'visible');
    return shuffleExploreIds(visible.map((p) => p.id));
  }, [
    exploreRankingFilter,
    categoryFilter,
    searchResults,
    categoryResults,
    exploreVisibleIdsKey,
    exploreVisitKey,
  ]);

  const filtered = useMemo(() => {
    if (exploreRankingFilter !== null) {
      return (rankingExploreProfiles ?? []).filter((p) => p.status === 'visible');
    }
    const base =
      categoryFilter === ''
        ? (searchResults !== null ? searchResults : profiles)
        : (categoryResults ?? []);
    const visible = base.filter((p) => p.status === 'visible');
    const ids = exploreShuffleIds;
    if (!ids || ids.length !== visible.length) {
      return visible;
    }
    const byId = new Map(visible.map((p) => [p.id, p]));
    return ids.map((id) => byId.get(id)).filter((p): p is BusinessProfile => Boolean(p));
  }, [
    exploreRankingFilter,
    rankingExploreProfiles,
    exploreShuffleIds,
    profiles,
    searchResults,
    categoryResults,
    categoryFilter,
  ]);

  const visibleSavedBusinesses = useMemo(
    () => savedBusinesses.filter((b) => !isBusinessHidden(b)),
    [savedBusinesses],
  );
  const visibleVisitHistory = useMemo(
    () => visitHistory.filter((v) => !isBusinessHidden(v.business)),
    [visitHistory],
  );
  const visibleMyProfiles = useMemo(
    () => myProfiles.filter((b) => !isBusinessHidden(b)),
    [myProfiles],
  );

  const isAdmin = authState.user?.username === 'Empripanel';
  const activeProfile = useMemo(() => {
    const id = selectedProfileId;
    if (!id) return undefined;
    const p =
      filtered.find((x) => x.id === id) ??
      profiles.find((x) => x.id === id) ??
      hiddenBusinesses.find((x) => x.id === id);
    if (!p) return undefined;
    if (!isAdmin && isBusinessHidden(p)) return undefined;
    return p;
  }, [selectedProfileId, filtered, profiles, hiddenBusinesses, isAdmin]);

  if (pathBusinessId && !authState.isAuthenticated) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, `/business/${pathBusinessId}`);
    }
    return <AuthModal onAuth={handleAuth} />;
  }

  if (pathBusinessId) {
    return (
      <BusinessPublicPage
        businessId={pathBusinessId}
        onClose={() => {
          setPathBusinessId(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  if (!authState.isAuthenticated) {
    return <AuthModal onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 pb-32">
      <Toast message={toast.message} visible={toast.visible} />
      {deletingProfileId && <ConfirmModal message="¿Estás seguro de que deseas eliminar este perfil de forma permanente?" onConfirm={executeDelete} onCancel={() => setDeletingProfileId(null)} confirmDisabled={deleteBusinessLoading} />}
      {showDeleteAccountConfirm && (
        <ConfirmModal 
          message="¿Estás seguro de que deseas eliminar tu perfil? Esta acción es permanente y no se puede deshacer." 
          onConfirm={handleDeleteAccount} 
          onCancel={() => setShowDeleteAccountConfirm(false)}
          confirmDisabled={profileActionLoading}
        />
      )}

      <header ref={headerRef} className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => { setActiveTab('home'); handleScrollToStart(); }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Logo className="w-8 h-8" />
            </div>
            
          </button>
          <div className="flex items-center gap-3 min-w-0">
             <button 
                onClick={() => { setActiveTab('profile'); handleScrollToStart(); }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-right group min-w-0 max-w-full"
             >
                <div className="flex flex-col items-end min-w-0 max-w-[10rem] sm:max-w-[14rem]">
                   <span
                     className={`text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest group-hover:text-teal-500 transition-colors ${
                       authState.user?.username && !/\s/.test(authState.user.username)
                         ? 'block w-full truncate whitespace-nowrap overflow-hidden text-ellipsis'
                         : 'block w-full text-right whitespace-normal break-words overflow-hidden'
                     }`}
                   >
                     @{authState.user?.username}
                   </span>
                   <span className="text-[9px] font-bold text-gray-400">{authState.user?.username === 'Empripanel' ? 'Administrador' : (authState.user?.role === 'BUSINESS' ? 'Negocio' : 'Explorador')}</span>
                </div>
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 shadow-sm border border-gray-50 dark:border-gray-800 group-hover:border-teal-500 transition-all">
                   {authState.user?.username === 'Empripanel' ? <Briefcase size={20} className="text-teal-600" /> : (authState.user?.role === 'BUSINESS' ? <Building2 size={20} /> : <User size={20} />)}
                </div>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-700">
            <div className="w-full -translate-x-2 flex flex-row items-center justify-center gap-3 mb-6 -mt-6">
              <Logo className="w-20 h-20 sm:w-28 sm:h-28" />
              <div>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-[1.1]">Empripanel</h2>
              </div>
            </div>

            <h3 className="w-fit mx-auto text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-200 mb-4 text-center opacity-80">Donde <span className="text-teal-600 dark:text-teal-400">descubrís</span> negocios</h3>
            
            <div className="flex items-center justify-center mb-10">
  <div className="flex items-center gap-4 bg-teal-50 dark:bg-teal-900/10 px-5 py-3 rounded-2xl border border-teal-100 dark:border-teal-900/20 shadow-sm">

    <Star
      size={16}
      className="text-teal-600 dark:text-teal-400 fill-teal-600 dark:fill-teal-400 animate-pulse shrink-0"
    />

    <div className="flex flex-col items-center text-center leading-tight">
      <p className="text-[10px] sm:text-xs font-black text-teal-700 dark:text-teal-300 uppercase tracking-widest">
        Categoría destacada del día
      </p>

      <p className="text-sm sm:text-base font-black text-teal-900 dark:text-teal-100 underline decoration-2 underline-offset-4 break-words">
        {getLabelForValue(featuredCategory) ?? featuredCategory}
      </p>
    </div>

    <Star
      size={16}
      className="text-teal-600 dark:text-teal-400 fill-teal-600 dark:fill-teal-400 animate-pulse shrink-0"
    />

  </div>
</div>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Buscá un negocio..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] pl-16 pr-6 py-5 shadow-sm text-gray-900 dark:text-white font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:border-teal-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    if (e.target.value.trim() === '') {
                      setSearchResults(null);
                      refreshProfilesList();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none min-w-[140px]">
                  <select className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] pl-8 pr-12 py-5 text-sm text-gray-900 dark:text-white font-bold shadow-sm appearance-none cursor-pointer outline-none focus:border-teal-500 transition-all overflow-y-auto" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="" className="bg-white dark:bg-gray-900 text-sm">Todas</option>
                    {CATEGORIES_SORTED.map(c => (
                      <option key={c.value} value={c.value} className="bg-white dark:bg-gray-900 text-sm">{c.value === featuredCategory ? `⭐ ${c.label}` : c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none" size={20} />
                </div>
                {exploreRankingFilter === null && (
                  <button onClick={handleShuffle} className="bg-teal-600 text-white p-5 rounded-[2rem] shadow-lg shadow-teal-500/20 hover:bg-teal-700 hover:scale-105 active:scale-95 transition-all" title="Shuffle"><Shuffle size={20} /></button>
                )}
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-1 mb-8 -mx-1 px-1 [scrollbar-width:thin]">
              <div className="flex w-full min-w-0 justify-center">
                <div
                  className="flex flex-nowrap items-center justify-center gap-3 sm:flex-wrap sm:max-w-full"
                  role="tablist"
                  aria-label="Ordenar exploración"
                >
                <button
                  type="button"
                  role="tab"
                  aria-selected={exploreRankingFilter === 'clicks'}
                  onClick={() => toggleExploreRanking('clicks')}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-tighter transition-all border-2 ${
                    exploreRankingFilter === 'clicks'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/25 text-teal-800 dark:text-teal-200 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-700'
                  }`}
                >
                  <BarChart3 size={16} className={exploreRankingFilter === 'clicks' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-500'} />
                  Top
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={exploreRankingFilter === 'new'}
                  onClick={() => toggleExploreRanking('new')}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-tighter transition-all border-2 ${
                    exploreRankingFilter === 'new'
                      ? 'border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-500/25'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-700'
                  }`}
                >
                  ¡Nuevos!
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={exploreRankingFilter === 'likes'}
                  onClick={() => toggleExploreRanking('likes')}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-tighter transition-all border-2 ${
                    exploreRankingFilter === 'likes'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/25 text-teal-800 dark:text-teal-200 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-700'
                  }`}
                >
                  <Heart
                    size={16}
                    fill={exploreRankingFilter === 'likes' ? 'currentColor' : 'none'}
                    className={
                      exploreRankingFilter === 'likes'
                        ? 'text-pink-500'
                        : 'text-gray-500 dark:text-gray-500'
                    }
                  />
                  Top
                </button>
                </div>
              </div>
            </div>

            <div className="relative min-h-[8rem]">
              {exploreRankingFilter !== null && rankingExploreLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2rem] bg-white/70 dark:bg-gray-950/70 backdrop-blur-[2px]">
                  <RefreshCw className="animate-spin text-teal-600 dark:text-teal-400" size={32} aria-hidden />
                  <span className="sr-only">Cargando ranking…</span>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-6">
                {filtered.map((p, idx) => (
                  <BusinessCard
                    key={p.id}
                    business={p}
                    onClick={setSelectedProfileId}
                    onVisit={handleVisit}
                    isFeatured={getValueForLabel(p.category) === featuredCategory || p.category === featuredCategory}
                    rankingPosition={exploreRankingFilter !== null ? idx + 1 : undefined}
                  />
                ))}
                {filtered.length === 0 && !(exploreRankingFilter !== null && rankingExploreLoading) && (
                  <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800 col-span-full">
                    <Search size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-bold italic">No se encontraron negocios con esos filtros.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-business' && authState.isAuthenticated && authState.user?.role === 'BUSINESS' && (
          <div className="animate-in slide-in-from-right duration-500 space-y-10">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white">Mis Paneles</h2>
              <button onClick={() => { setEditingProfile(undefined); setShowProfileModal(true); }} className="bg-teal-600 text-white p-5 rounded-3xl shadow-xl hover:bg-teal-700 transition-all active:scale-95"><Plus size={24} /></button>
            </div>
            {visibleMyProfiles.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {visibleMyProfiles.map(p => (
                  <div key={p.id} className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-[3rem] shadow-md border-2 border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between group hover:border-teal-500 transition-all gap-6">
                    <div className="flex items-center gap-6 flex-1 w-full">
                      <div className="relative overflow-hidden rounded-[1.25rem] w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <img src={p.logo} className="w-full h-full object-contain rounded-[1rem] p-1" alt="" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{p.publicName}</h3>
                        <p className="text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-widest mb-2">{p.category}</p>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-black text-[10px] uppercase">
                              <BarChart3 size={12} className="text-teal-600 dark:text-teal-400" /> {p.clicks} clics
                           </div>
                           <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-black text-[10px] uppercase">
                              <Heart size={12} className="text-pink-500" /> {p.likes} likes
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => { setEditingProfile(p); setShowProfileModal(true); }} className="flex-1 sm:flex-none p-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all active:scale-90 flex items-center justify-center gap-2 font-black text-sm"><Edit3 size={18} /> <span className="sm:hidden">Editar</span></button>
                      <button onClick={() => setDeletingProfileId(p.id)} className="flex-1 sm:flex-none p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-500 dark:hover:bg-red-600 hover:text-white transition-all active:scale-90 flex items-center justify-center gap-2 font-black text-sm"><Trash2 size={18} /> <span className="sm:hidden">Borrar</span></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-teal-50/50 dark:bg-teal-900/5 rounded-[3rem] border-2 border-dashed border-teal-200 dark:border-teal-900/30">
                <PlusCircle size={40} className="mx-auto text-teal-400 dark:text-teal-600 mb-4" />
                <p className="text-teal-800 dark:text-teal-200 font-black mb-6">Aún no creaste ninguna ficha pública.</p>
                <button onClick={() => { setEditingProfile(undefined); setShowProfileModal(true); }} className="bg-teal-600 text-white px-10 py-5 rounded-2xl font-black shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all">Crear Mi Ficha</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && authState.isAuthenticated && (
          <div className="animate-in slide-in-from-right duration-500 space-y-12">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Mi {authState.user?.username === 'Empripanel' ? 'administración' : (authState.user?.role === 'BUSINESS' ? 'negocio' : 'usuario')}</h2>
               <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                  {authState.user?.username === 'Empripanel' ? <Briefcase size={24} /> : (authState.user?.role === 'BUSINESS' ? <Building2 size={24} /> : <User size={24} />)}
               </div>
            </div>
            
            {/* Burbuja superior: Icono, Nombre y Email editable */}
            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[3.5rem] border-2 border-gray-50 dark:border-gray-800 shadow-md">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-teal-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20 shrink-0">
                  {authState.user?.username === 'Empripanel' ? (
                    <Briefcase size={32} className="sm:size-12" />
                  ) : authState.user?.role === 'BUSINESS' ? (
                    <Building2 size={32} className="sm:size-12" />
                  ) : (
                    <User size={32} className="sm:size-12" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-2xl sm:text-3xl font-black text-gray-900 dark:text-white ${
                      authState.user?.username && !/\s/.test(authState.user.username)
                        ? 'truncate whitespace-nowrap overflow-hidden text-ellipsis'
                        : 'whitespace-normal break-words overflow-hidden'
                    }`}
                  >
                    @{authState.user?.username}
                  </h3>
                  <div className="mt-2 group relative">
                    {isEditingEmail ? (
                      <div className="flex flex-col gap-2 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus
                            type="email" 
                            className={`bg-gray-50 dark:bg-gray-800 border-2 rounded-xl px-4 py-2 font-bold text-sm w-full outline-none dark:text-white transition-all ${emailEditError ? 'border-red-500' : 'border-teal-500'}`}
                            value={tempEmail}
                            onChange={(e) => { setTempEmail(e.target.value); setEmailEditError(null); }}
                          />
                          <button type="button" disabled={profileActionLoading} onClick={handleUpdateEmail} className="p-2 bg-teal-600 text-white rounded-xl shadow-lg active:scale-90 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"><CheckCircle size={18}/></button>
                          <button onClick={() => { setIsEditingEmail(false); setEmailEditError(null); }} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl active:scale-90 transition-all shrink-0"><CloseIcon size={18}/></button>
                        </div>
                        {emailEditError && <p className="text-red-600 text-[10px] font-black ml-2 animate-in slide-in-from-top-1">{emailEditError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 max-w-full">
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-sm sm:text-base flex items-center gap-2 truncate flex-1">
                           <Mail size={16} className="text-teal-600 dark:text-teal-400 shrink-0" /> 
                           <span className="truncate">{authState.user?.privateEmail}</span>
                        </p>
                        <button 
                          onClick={() => { setTempEmail(authState.user!.privateEmail); setIsEditingEmail(true); setEmailEditError(null); }} 
                          className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/10 rounded-xl transition-all shrink-0"
                          title="Editar Correo"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Guardados */}
            <section className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 px-2"><Heart size={20} className="text-pink-500 fill-pink-500" /> Guardados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-4">
                {visibleSavedBusinesses.length > 0 ? (
                  visibleSavedBusinesses.map(p => (
                    <BusinessCard key={p.id} business={p} onClick={setSelectedProfileId} onVisit={handleVisit} />
                  ))
                ) : (<div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-gray-100 dark:border-gray-800 border-dashed"><p className="text-gray-400 dark:text-gray-600 font-bold italic text-sm">Sin guardados.</p></div>)}
              </div>
            </section>

            {/* Historial de Visitas */}
            <section className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 px-2"><Clock size={20} className="text-teal-600 dark:text-teal-400" /> Historial de Visitas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-4">
                {visibleVisitHistory.length > 0 ? (
                  visibleVisitHistory.map((v, idx) => (
                    <BusinessCard key={`${v.business.id}-${idx}`} business={v.business} onClick={setSelectedProfileId} onVisit={handleVisit} />
                  ))
                ) : (<div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-gray-100 dark:border-gray-800 border-dashed"><p className="text-gray-400 dark:text-gray-600 font-bold italic text-sm">Aún no visitaste ningún negocio.</p></div>)}
              </div>
            </section>

            {/* Administrador Specific Order */}
            {isAdmin && (
              <div className="space-y-12">
                {/* Fichas Ocultas por Reportes */}
                <section className="space-y-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 px-2"><AlertTriangle size={20} className="text-orange-600" /> Fichas ocultadas por reportes</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {hiddenBusinesses.length > 0 ? (
                      hiddenBusinesses.map(p => (
                        <div key={p.id} className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-red-50 dark:border-red-900/10 shadow-sm hover:border-red-200 transition-all group flex flex-col sm:flex-row gap-6">
                          <div onClick={() => setSelectedProfileId(p.id)} className="flex items-center gap-5 cursor-pointer flex-1">
                            <div className="relative overflow-hidden rounded-xl w-14 h-14 flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                               <img src={p.logo} className="w-full h-full object-contain rounded-lg p-0.5" alt="" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">{p.category} | {(p.reportCount ?? p.reports?.length ?? 0)} reportes</p>
                              <span className="font-black text-gray-900 dark:text-white text-lg leading-tight block">{p.publicName}</span>
                              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">{p.hiddenReason}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => fetchHiddenBusinesses()} className="p-4 bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 rounded-2xl hover:bg-teal-600 hover:text-white transition-all active:scale-90" title="Actualizar lista"><Eye size={18} /></button>
                            <button onClick={() => handleRestore(p.id)} className="p-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all active:scale-90" title="Reponer"><RotateCcw size={18} /></button>
                            <button onClick={() => { setEditingProfile(p); setShowProfileModal(true); }} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90" title="Editar"><Edit3 size={18} /></button>
                            <button onClick={() => { setDeletingProfileId(p.id); }} className="p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-600 dark:hover:bg-red-500 hover:text-white transition-all active:scale-90" title="Eliminar"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      ))
                    ) : (<div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-gray-100 dark:border-gray-800 border-dashed"><p className="text-gray-400 dark:text-gray-600 font-bold italic text-sm">No hay fichas ocultas en este momento.</p></div>)}
                  </div>
                </section>

                {/* Reset User Password Tool */}
                <section className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[3.5rem] border-2 border-teal-50 dark:border-teal-900/20 shadow-md space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-2xl"><Key size={24} /></div>
                     <h3 className="text-2xl font-black text-gray-900 dark:text-white">Resetear contraseña de usuario</h3>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Username *</label>
                        <input 
                          className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 font-bold outline-none transition-all focus:border-teal-500 focus:bg-white dark:focus:bg-gray-900" 
                          placeholder="ej: juan_explora" 
                          value={resetUser.username} 
                          onChange={e => setResetUser({...resetUser, username: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-2">Contraseña temporal *</label>
                        <input 
                          className="w-full bg-gray-50 dark:bg-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 font-bold outline-none transition-all focus:border-teal-500 focus:bg-white dark:focus:bg-gray-900" 
                          placeholder="Nueva pass" 
                          type="password"
                          value={resetUser.newPass} 
                          onChange={e => setResetUser({...resetUser, newPass: e.target.value})} 
                        />
                      </div>
                    </div>
                    <button 
                      disabled={!resetUser.username || !resetUser.newPass}
                      className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-2xl font-black shadow-xl shadow-teal-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Lock size={20} /> Confirmar reset
                    </button>
                  </form>
                </section>
              </div>
            )}

            {/* Switch Role — not for ADMIN (backend forbids it) */}
            {authState.user?.role !== 'ADMIN' && (
            <div className="px-2">
              <button 
                type="button"
                disabled={profileActionLoading}
                onClick={handleToggleRole}
                className="w-full flex items-center justify-between p-6 bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 rounded-[2.5rem] font-black shadow-sm hover:bg-teal-100 dark:hover:bg-teal-900/20 transition-all border-2 border-teal-200/50 dark:border-teal-800/30 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start">
                  <span className="text-xs uppercase tracking-widest opacity-60 mb-0.5">Tipo de cuenta</span>
                  <span className="text-lg">Cambiar a perfil de {authState.user?.role === 'BUSINESS' ? 'usuario' : 'negocio'}</span>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-md group-hover:rotate-180 transition-transform duration-500">
                  <RefreshCw size={24} />
                </div>
              </button>
            </div>
            )}

            {/* Acciones menos frecuentes: Cambiar Pass, Logout, Delete (Finales) */}
            <div className="bg-white dark:bg-gray-900 p-8 sm:p-12 rounded-[3.5rem] border-2 border-gray-50 dark:border-gray-800 shadow-md space-y-3">
              <button onClick={() => setShowChangePass(!showChangePass)} className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-3xl font-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
                Cambiar contraseña <Key size={24} />
              </button>
              {showChangePass && (
                <form onSubmit={handleChangeOwnPassword} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl space-y-4 border border-gray-100 dark:border-gray-700 animate-in slide-in-from-top duration-300">
                  <input 
                    type="password" 
                    placeholder="Contraseña actual" 
                    className="w-full bg-white dark:bg-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 font-bold outline-none focus:border-teal-500"
                    value={changePassForm.current}
                    onChange={e => setChangePassForm({...changePassForm, current: e.target.value})}
                  />
                  <input 
                    type="password" 
                    placeholder="Nueva contraseña" 
                    className="w-full bg-white dark:bg-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 font-bold outline-none focus:border-teal-500"
                    value={changePassForm.new}
                    onChange={e => setChangePassForm({...changePassForm, new: e.target.value})}
                  />
                  <input 
                    type="password" 
                    placeholder="Confirmar nueva contraseña" 
                    className="w-full bg-white dark:bg-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 font-bold outline-none focus:border-teal-500"
                    value={changePassForm.confirm}
                    onChange={e => setChangePassForm({...changePassForm, confirm: e.target.value})}
                  />
                  <button type="submit" disabled={profileActionLoading} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Actualizar contraseña</button>
                </form>
              )}
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-6 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-3xl font-black hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors shadow-sm">
                Cerrar Sesión <LogOut size={24} />
              </button>
              <button onClick={() => setShowDeleteAccountConfirm(true)} className="w-full flex items-center justify-between p-6 bg-red-500 text-white rounded-3xl font-black hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                Eliminar Perfil <UserMinus size={24} />
              </button>
            </div>

            {/* Redes sociales oficiales */}
            <div className="bg-teal-50/30 dark:bg-teal-900/10 p-8 sm:p-12 rounded-[3.5rem] border-2 border-teal-100 dark:border-teal-900/20 shadow-sm space-y-8">
               <h4 className="text-center font-black text-gray-900 dark:text-white text-lg">¡Seguinos en nuestras cuentas oficiales!</h4>
               <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                  {OFFICIAL_LINKS.map(social => (
                    <a 
                      key={social.label} 
                      href={social.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-3 group transition-transform hover:scale-110 active:scale-95"
                    >
                      <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-md border border-teal-50 dark:border-gray-700 group-hover:border-teal-500 transition-all">
                        {typeof social.icon === 'function' ? <social.icon /> : <social.icon size={24} />}
                      </div>
                      <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 tracking-widest">{social.label}</span>
                    </a>
                  ))}
               </div>
            </div>
            
            <div className="text-center pb-10 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Atención al cliente - Reporte de errores.</p>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500">soporte@empripanel.com</p>
              </div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Versión 1.0</p>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500">© 2026 Santiago Pérez Junqueira. Todos los derechos reservados.</p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Navigation Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/10 dark:border-white/5 shadow-2xl transition-all">
        <button onClick={() => { setActiveTab('home'); handleScrollToStart(); }} className={`px-6 sm:px-8 py-4 rounded-[1.8rem] font-black text-xs transition-all flex items-center gap-2 ${activeTab === 'home' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-300'}`}>
          <HomeIcon size={18} /> <span className="hidden sm:inline">Explorar</span>
        </button>
        
        {/* Botón Back to top contextual */}
        {showBackToTop && (
          <button 
            onClick={handleScrollToStart} 
            className="mx-1 bg-teal-600 text-white p-4 rounded-full shadow-lg shadow-teal-500/40 hover:scale-110 active:scale-90 transition-all flex-shrink-0 animate-in zoom-in fade-in duration-300"
            title="Ir al inicio"
          >
            <ArrowUp size={18} />
          </button>
        )}

        {authState.user?.role === 'BUSINESS' && (
          <button onClick={() => { setActiveTab('my-business'); handleScrollToStart(); }} className={`px-6 sm:px-8 py-4 rounded-[1.8rem] font-black text-xs transition-all flex items-center gap-2 ${activeTab === 'my-business' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-300'}`}>
            <LayoutGrid size={18} /> <span className="hidden sm:inline">Mi Panel</span>
          </button>
        )}
        <button onClick={() => { setActiveTab('profile'); handleScrollToStart(); }} className={`px-6 sm:px-8 py-4 rounded-[1.8rem] font-black text-xs transition-all flex items-center gap-2 ${activeTab === 'profile' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-gray-300'}`}>
          <UserIcon size={18} /> <span className="hidden sm:inline">Perfil</span>
        </button>
      </div>

      {activeProfile && (
        <BusinessDetail 
          business={activeProfile} 
          user={authState.user} 
          likedBusinessIds={likedBusinessIds}
          reportedBusinessIds={reportedBusinessIds}
          visitedBusinessIds={visitedBusinessIds}
          onClose={() => setSelectedProfileId(null)} 
          onLike={handleLike} 
          onVisit={handleVisit} 
          onShare={handleShare}
          onReport={handleReport}
          onEdit={() => {
            setEditingProfile(activeProfile);
            setShowProfileModal(true);
          }}
          onDelete={(id) => {
            setDeletingProfileId(id);
          }}
          onHide={isAdmin ? handleHide : undefined}
          onRestore={isAdmin ? handleRestore : undefined}
          onRefreshProfiles={refreshProfilesList}
          onToast={(msg) => {
            setToast({ message: mapApiMessage(msg, 'Acción realizada correctamente'), visible: true });
            setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
          }}
        />
      )}
      {showProfileModal && (
        <ProfileEditorModal
          onClose={() => setShowProfileModal(false)}
          ownerId={editingProfile ? editingProfile.ownerId : authState.user!.id}
          onSave={async () => {
            await refreshProfilesList();
            await refreshPanelProfiles();
            setShowProfileModal(false);
          }}
          initialData={editingProfile}
        />
      )}
    </div>
  );
};

export default App;
