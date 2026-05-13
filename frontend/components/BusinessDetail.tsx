
import React, { useEffect } from 'react';
import { BusinessProfile, UserAccount } from '../types';
import { X as CloseIcon, Heart, ExternalLink, Share2, BarChart3, MapPin, Mail, Phone, Instagram, Linkedin, Facebook, Globe, AlertTriangle, Edit3, Trash2, EyeOff, Eye, Youtube } from 'lucide-react';

interface BusinessDetailProps {
  business: BusinessProfile;
  user: UserAccount | null;
  likedBusinessIds?: string[];
  reportedBusinessIds?: string[];
  visitedBusinessIds?: string[];
  onClose: () => void;
  onLike: (id: string) => void;
  onVisit: (business: BusinessProfile) => void;
  onShare: (business: BusinessProfile) => void;
  onReport?: (id: string) => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
  onHide?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRefreshProfiles?: () => void;
  onToast?: (message: string) => void;
}

const ensureHttps = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

function truncateText(input: string, maxChars: number) {
  const text = input ?? '';
  if (text.length <= maxChars) return text;
  const ellipsis = '...';
  const maxWithoutEllipsis = Math.max(0, maxChars - ellipsis.length);
  const slice = text.slice(0, maxWithoutEllipsis);
  const lastSpace = slice.lastIndexOf(' ');
  const safe = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${safe}${ellipsis}`;
}

const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a6.417 6.417 0 0 1-1.87-1.57v8.52c0 1.25-.2 2.5-.74 3.63-.52 1.13-1.32 2.14-2.34 2.87-1.03.73-2.27 1.2-3.56 1.34-1.28.14-2.6-.01-3.82-.45-1.22-.44-2.31-1.2-3.14-2.18-1.02-1.2-1.63-2.73-1.74-4.3-.11-1.57.25-3.18.99-4.57.74-1.39 1.88-2.56 3.25-3.29.9-.48 1.89-.78 2.9-.88v4.08a4.135 4.135 0 0 0-3.32 3.92c0 2.28 1.85 4.13 4.13 4.13 2.24 0 4.04-1.79 4.13-4.01V.02z" />
  </svg>
);

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, user, likedBusinessIds = [], reportedBusinessIds = [], visitedBusinessIds = [], onClose, onLike, onVisit, onShare, onReport, onEdit, onDelete, onHide, onRestore, onRefreshProfiles, onToast }) => {
  const isLiked = likedBusinessIds.includes(business.id);
  const isReported = reportedBusinessIds.includes(business.id);
  const isVisited = visitedBusinessIds.includes(business.id);
  const isAdmin = user?.username === 'Empripanel';
  const [reportCount, setReportCount] = useState(0);

useEffect(() => {
  setReportCount(
    business.reportCount ?? business.reports.length
  );
}, [business]);
  
  useEffect(() => {
    // Disable background scroll
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleShare = () => {
    onShare(business);
  };

  const handleReport = () => {
  if (onReport) {
    const wasReported = isReported;

    onReport(business.id);

    setReportCount((prev) =>
      wasReported
        ? Math.max(0, prev - 1)
        : prev + 1
    );
  }
};

  const handleSocialClick = (url: string) => {
    if (!url) return;
    window.open(ensureHttps(url), '_blank');
  };

  const socialIcons = [
    { key: 'instagram', Icon: Instagram, value: business.socials.instagram },
    { key: 'tiktok', Icon: TikTokIcon, value: business.socials.tiktok },
    { key: 'youtube', Icon: Youtube, value: business.socials.youtube },
    { key: 'twitter', Icon: XIcon, value: business.socials.twitter },
    { key: 'linkedin', Icon: Linkedin, value: business.socials.linkedin },
    { key: 'facebook', Icon: Facebook, value: business.socials.facebook },
    { key: 'website', Icon: Globe, value: business.socials.website },
  ].filter(social => !!social.value);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl max-h-[95vh] sm:rounded-[3rem] shadow-2xl overflow-y-auto relative animate-in slide-in-from-bottom duration-300 border-t sm:border border-gray-100 dark:border-gray-800">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 rounded-full backdrop-blur-md shadow-lg transition-all active:scale-90 border border-gray-100 dark:border-gray-700">
          <CloseIcon size={20} className="text-gray-900 dark:text-white" />
        </button>

        <div className="relative h-72 sm:h-96 w-full">
          <img src={business.logo} alt={business.publicName} className="w-full h-full object-cover dark:brightness-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent flex items-end p-8 sm:p-12">
            <div>
              <span className="inline-block px-4 py-1.5 bg-teal-600 text-white text-[10px] font-black rounded-full mb-4 uppercase tracking-widest shadow-lg">
                {business.category}
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white drop-shadow-md leading-tight">{truncateText(business.publicName, 21)}</h2>
              {business.status === 'hidden' && (
                <p className="text-red-400 font-black text-xs uppercase tracking-tighter mt-2">{business.hiddenReason}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {/* Admin Toolbar */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
              <p className="w-full text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">Poderes de Administrador</p>
              <button 
                onClick={onEdit} 
                className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-gray-100 dark:border-gray-700 hover:text-teal-600 transition-all"
              >
                <Edit3 size={14} /> Editar
              </button>
              <button 
                onClick={() => onDelete && onDelete(business.id)} 
                className="flex items-center gap-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-red-600 hover:text-white transition-all"
              >
                <Trash2 size={14} /> Eliminar
              </button>
              {business.status === 'visible' ? (
                <button 
                  onClick={() => onHide?.(business.id)} 
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-gray-100 dark:border-gray-700 hover:text-red-600 transition-all"
                >
                  <EyeOff size={14} /> Ocultar
                </button>
              ) : (
                <button 
                  onClick={() => onRestore?.(business.id)} 
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 px-4 py-2 rounded-xl text-xs font-black shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-teal-600 hover:text-white transition-all"
                >
                  <Eye size={14} /> Reponer
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 sm:gap-8 mb-6 sm:mb-10 py-4 sm:py-6 border-y border-gray-100 dark:border-gray-800">
  
  {/* VISITAS */}
  <div className="flex items-center gap-2 sm:gap-3 min-w-[0]">
    <div
      className={`p-2 sm:p-3 rounded-2xl shadow-sm border ${
        isVisited
          ? 'bg-teal-500 text-white border-teal-600'
          : 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30'
      }`}
    >
      <BarChart3 className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
    </div>
    <div>
      <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
        Visitas
      </p>
      <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white min-w-[32px] text-center">
        {business.clicks}
      </p>
    </div>
  </div>

  {/* LIKES */}
  <div className="flex items-center gap-2 sm:gap-3 min-w-[0]">
    <div
      className={`p-2 sm:p-3 rounded-2xl shadow-sm border ${
        isLiked
          ? 'bg-pink-500 text-white border-pink-600'
          : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30'
      }`}
    >
      <Heart
        className="w-[18px] h-[18px] sm:w-6 sm:h-6"
        fill={isLiked ? 'currentColor' : 'none'}
      />
    </div>
    <div>
      <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
        Likes
      </p>
      <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white min-w-[32px] text-center">
        {business.likes}
      </p>
    </div>
  </div>

  {/* REPORTES */}
  <div className="flex items-center gap-2 sm:gap-3 min-w-[0]">
    <div
      className={`p-2 sm:p-3 rounded-2xl shadow-sm border ${
        isReported
          ? 'bg-orange-500 text-white border-orange-600'
          : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30'
      }`}
    >
      <AlertTriangle className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
    </div>
    <div>
      <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
        Reportes
      </p>
      <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white min-w-[32px] text-center">
        {reportCount}
      </p>
    </div>
  </div>

</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
            {business.location && (
              <div className="flex items-start gap-4">
                <MapPin size={22} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <div><h5 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Ubicación</h5><p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{business.location}</p></div>
              </div>
            )}
            {business.publicEmail && (
              <div className="flex items-start gap-4">
                <Mail size={22} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <div><h5 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Email Público</h5><p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{business.publicEmail}</p></div>
              </div>
            )}
            {business.publicPhone && (
              <div className="flex items-start gap-4">
                <Phone size={22} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <div><h5 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Teléfono</h5><p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{business.publicPhone}</p></div>
              </div>
            )}
            {socialIcons.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="shrink-0 flex items-center justify-center w-[22px] h-[22px]"><Share2 size={22} className="text-teal-600 dark:text-teal-400" /></div>
                <div>
                  <h5 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Redes y Web</h5>
                  <div className="flex flex-wrap gap-5 mt-1">
                    {socialIcons.map(({ key, Icon, value }) => (
                      <button 
                        key={key} 
                        onClick={() => handleSocialClick(value as string)}
                        className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all p-1 -m-1 active:scale-90"
                        aria-label={key}
                      >
                        <Icon />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-12 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-inner">
            <h4 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Sobre nosotros</h4>
            <p className="text-gray-900 dark:text-gray-100 font-medium leading-relaxed text-lg italic whitespace-normal break-normal overflow-hidden max-w-full">
              "{business.fullDescription}"
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white dark:bg-gray-950 pt-6 pb-2 mt-auto border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => onVisit(business)} 
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-teal-500/20 active:scale-95 border border-white/10"
            >
              <ExternalLink size={24} /> Visitar Negocio
            </button>
            <div className="flex gap-3">
              <button onClick={() => onLike(business.id)} className={`w-20 h-16 rounded-2xl flex items-center justify-center transition-all shadow-md ${isLiked ? 'bg-pink-500 text-white shadow-pink-500/20 active:scale-95' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'}`}>
                <Heart size={28} fill={isLiked ? 'currentColor' : 'none'} className="transition-transform active:scale-125" />
              </button>
              <button onClick={handleReport} className={`w-20 h-16 rounded-2xl flex items-center justify-center transition-all shadow-md ${isReported ? 'bg-orange-600 text-white active:scale-95' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}>
                <AlertTriangle size={28} className="transition-transform active:scale-125" />
              </button>
              <button onClick={handleShare} className="w-20 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all shadow-md active:scale-95"><Share2 size={28} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
