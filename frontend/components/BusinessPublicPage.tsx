import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import * as authApi from '../services/authApi';
import type { BackendBusiness } from '../services/authApi';
import { userFacingError } from '../src/shared/userMessages';

interface BusinessPublicPageProps {
  businessId: string;
  onClose: () => void;
}

const BusinessPublicPage: React.FC<BusinessPublicPageProps> = ({ businessId, onClose }) => {
  const [business, setBusiness] = useState<BackendBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authApi
      .getBusinessById(businessId)
      .then((data) => {
        if (!cancelled) {
          setBusiness(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(userFacingError(err, 'No pudimos cargar este negocio. Inténtalo nuevamente.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando negocio...</p>
        </div>
      </div>
    );
  }

  if (error || !business || business.hidden === true) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 font-medium mb-6">
            {error ?? (business?.hidden ? 'Negocio no disponible' : 'Negocio no encontrado')}
          </p>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft size={20} /> Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 font-medium mb-8 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} /> Volver
        </button>

        <article className="rounded-[2rem] overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-lg bg-white dark:bg-gray-900">
          <div className="aspect-[16/10] w-full bg-gray-100 dark:bg-gray-800">
            <img
              src={business.bannerImageUrl}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8">
            {business.category && (
              <span className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                {business.category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2">
              {business.name}
            </h1>
            {business.slogan && (
              <p className="text-lg text-teal-600 dark:text-teal-400 font-semibold mb-4">
                {business.slogan}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {business.description}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BusinessPublicPage;
